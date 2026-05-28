package com.claimo.api.company.invites;

import com.claimo.api.company.enums.CompanyInviteStatus;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.company.model.Company;
import com.claimo.api.company.model.CompanyInvite;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.integrations.clerk.ClerkInvitationService;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyInviteService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberService companyMemberService;
    private final CompanyInviteRepository companyInviteRepository;
    private final ClerkInvitationService clerkInvitationService;
    private final UserService userService;

    /**
     * Invites a user to a company by email.
     *
     * Validates the inviter has ADMIN or ACCOUNT_OWNER role, checks the invitee
     * is not already a member, sends the invitation via Clerk, then persists
     * the invite record in a single save only after Clerk succeeds.
     *
     * If Clerk fails, no invite record is saved — avoiding orphaned records
     * with no clerkInvitationId.
     */

    @Transactional
    public void inviteMember(Jwt jwt, UUID companyId, String email, CompanyRole role) {
        User inviter = getAuthenticatedUser(jwt);
        Company company = getCompanyForAdmin(companyId, inviter);

        String normalizedEmail = email.toLowerCase().trim();

        if (inviter.getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new AppExceptions.BadRequestException("You cannot invite yourself to a company");
        }

        // If the user already exists in our system, check they are not already a member
        Optional<User> existingUser = userService.findByEmail(normalizedEmail);
        if (existingUser.isPresent() && companyMemberService.isMemberOfCompany(existingUser.get().getId(), companyId)) {
            throw new AppExceptions.ConflictException("User is already a member of this company");
        }

        boolean hasPendingInvite = companyInviteRepository.findAllByCompany_Id(companyId).stream()
                .anyMatch(i -> i.getEmail().equalsIgnoreCase(normalizedEmail)
                        && i.getStatus() == CompanyInviteStatus.PENDING);

        if (hasPendingInvite) {
            throw new AppExceptions.ConflictException("A pending invite already exists for email: " + normalizedEmail);
        }

        // Send invitation via Clerk first — if this fails, nothing is saved to DB.
        // This avoids an orphaned invite record with no clerkInvitationId.
        String clerkInvitationId = clerkInvitationService.sendInvitation(normalizedEmail);

        // Only save once we have a valid Clerk invitation ID
        CompanyInvite invite = new CompanyInvite();
        invite.setEmail(normalizedEmail);
        invite.setCompany(company);
        invite.setRole(role);
        invite.setStatus(CompanyInviteStatus.PENDING);
        invite.setInvitedBy(inviter);
        invite.setClerkInvitationId(clerkInvitationId);
        companyInviteRepository.save(invite);

        log.info("Stored company invite email={} companyId={} clerkInvitationId={}",
                normalizedEmail, companyId, clerkInvitationId);
    }

    @Transactional
    public void recordInvitationCreated(String email, String clerkInvitationId) {
        companyInviteRepository.findByClerkInvitationId(clerkInvitationId).ifPresent(invite -> {
            if (invite.getStatus() != CompanyInviteStatus.PENDING) {
                invite.setStatus(CompanyInviteStatus.PENDING);
                companyInviteRepository.save(invite);
            }
            log.info("Processed company invitation created event email={} invitationId={}", email, clerkInvitationId);
        });
    }

    /**
     * Marks a company invite as accepted when Clerk fires the invitation.accepted
     * webhook.
     *
     * At this point the user may not exist in our system yet — they may still be
     * completing signup. Membership is not finalized here; that happens in
     * acceptAndFinalizeInvitation or markUserCreatedInvitesAccepted once the
     * user.created webhook fires.
     */
    @Transactional
    public void acceptInvitation(String email, String clerkInvitationId) {
        List<CompanyInvite> invites = findInvites(clerkInvitationId, email);
        if (invites.isEmpty()) {
            log.warn("No company invite found for accepted invitation email={} invitationId={}", email,
                    clerkInvitationId);
            return;
        }

        for (CompanyInvite invite : invites) {
            acceptInvite(invite);
        }

        log.info("Processed company invitation accepted event email={} invitationId={}", email, clerkInvitationId);
    }

    /**
     * Marks an invite as ACCEPTED if it is not already accepted.
     * Idempotent — safe to call multiple times on the same invite.
     */
    private void acceptInvite(CompanyInvite invite) {
        if (invite.getStatus() != CompanyInviteStatus.ACCEPTED) {
            invite.setStatus(CompanyInviteStatus.ACCEPTED);
            invite.setAcceptedAt(Instant.now());
            companyInviteRepository.save(invite);
        }
    }

    /**
     * Accepts and fully finalizes a company invite for a known user.
     *
     * Used when the user already exists in our system at the time the invitation
     * is accepted — skips the intermediate ACCEPTED state and immediately adds
     * them as a company member.
     */
    @Transactional
    public void acceptAndFinalizeInvitation(String email, String clerkInvitationId, User user) {
        List<CompanyInvite> invites = findInvites(clerkInvitationId, email);
        if (invites.isEmpty()) {
            log.warn("No company invite found while finalizing invitation email={} invitationId={}", email,
                    clerkInvitationId);
            return;
        }

        for (CompanyInvite invite : invites) {
            acceptInvite(invite);
            finalizeInvite(invite, user);
        }
    }

    /**
     * Finds non-revoked invites by Clerk invitation ID, falling back to email
     * lookup.
     *
     * Prefers lookup by clerkInvitationId since it is unique and unambiguous.
     * Falls back to email if the ID is missing or no match is found — this
     * handles edge cases where the webhook payload does not include an ID.
     */
    public List<CompanyInvite> findInvites(String clerkInvitationId, String email) {
        if (clerkInvitationId != null && !clerkInvitationId.isBlank()) {
            return companyInviteRepository.findByClerkInvitationId(clerkInvitationId)
                    .filter(invite -> invite.getStatus() != CompanyInviteStatus.REVOKED)
                    .map(List::of)
                    .orElseGet(() -> companyInviteRepository.findAllByEmail(email).stream()
                            .filter(invite -> invite.getStatus() != CompanyInviteStatus.REVOKED)
                            .toList());
        }
        return companyInviteRepository.findAllByEmail(email).stream()
                .filter(invite -> invite.getStatus() != CompanyInviteStatus.REVOKED)
                .toList();
    }

    /**
     * Finalizes all PENDING invites for a user who just signed up.
     *
     * Called from the user.created webhook handler after a new user is persisted.
     * Finds any PENDING invites for their email, marks them accepted, and adds
     * them as a member to each invited company.
     *
     * Only processes PENDING invites — ACCEPTED and REVOKED invites are skipped
     * to avoid duplicate membership additions.
     */
    @Transactional
    public void markUserCreatedInvitesAccepted(String email, User user) {
        List<CompanyInvite> invites = companyInviteRepository.findAllByEmail(email).stream()
                .filter(invite -> invite.getStatus() != CompanyInviteStatus.REVOKED)
                .toList();
        if (invites.isEmpty()) {
            return;
        }

        for (CompanyInvite invite : invites) {
            acceptInvite(invite);
            finalizeInvite(invite, user);
        }
    }

    /**
     * Marks all matching invites as REVOKED when Clerk fires the invitation.revoked
     * webhook.
     *
     * Revoked invites are excluded from all future invite lookups so they cannot
     * be accidentally accepted after revocation.
     */
    @Transactional
    public void revokeInvitation(String email, String clerkInvitationId) {
        findInvites(clerkInvitationId, email).forEach(invite -> {
            invite.setStatus(CompanyInviteStatus.REVOKED);
            companyInviteRepository.save(invite);
        });
        log.info("Processed company invitation revoked event email={} invitationId={}", email, clerkInvitationId);
    }

    /**
     * Returns true if the email has any PENDING invites.
     *
     * Used during user creation to determine whether to skip automatic company
     * creation — if the user was invited to an existing company, they should
     * join that company instead of creating their own.
     */
    public boolean hasPendingInvites(String email) {
        return companyInviteRepository.findAllByEmail(email).stream()
                .anyMatch(invite -> invite.getStatus() != CompanyInviteStatus.REVOKED);
    }

    /**
     * Adds the user as a company member if they are not already one.
     * Idempotent — safe to call multiple times on the same invite and user.
     */
    private void finalizeInvite(CompanyInvite invite, User user) {
        if (!companyMemberService.isMemberOfCompany(user.getId(), invite.getCompany().getId())) {
            companyMemberService.addMember(invite.getCompany(), user, invite.getRole());
        }
    }

    /**
     * Resolves the authenticated user from the JWT subject (Clerk user ID).
     * Throws if the user does not exist in our system.
     */
    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

    /**
     * Loads the company and verifies the user has ADMIN or ACCOUNT_OWNER role.
     *
     * Relies solely on the company_members role — the owner field on Company
     * is not used for authorization to keep role checks consistent and avoid
     * a separate code path for the original owner.
     */
    private Company getCompanyForAdmin(UUID companyId, User user) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Company not found: " + companyId));

        if (company.getOwner() != null && company.getOwner().getId().equals(user.getId())) {
            return company;
        }

        if (!companyMemberService.isMemberOfCompany(user.getId(), companyId)) {
            throw new AppExceptions.ForbiddenException("You are not a member of this company");
        }

        CompanyRole role = companyMemberService.getRole(companyId, user.getId());
        if (role != CompanyRole.ADMIN) {
            throw new AppExceptions.ForbiddenException("Only company ADMINs can invite members");
        }

        return company;
    }

    @Transactional
    public void cancelInvitation(Jwt jwt, UUID companyId, UUID inviteId) {
        User user = getAuthenticatedUser(jwt);
        getCompanyForAdmin(companyId, user);

        CompanyInvite invite = companyInviteRepository.findById(inviteId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Invite not found: " + inviteId));

        if (invite.getStatus() != CompanyInviteStatus.PENDING) {
            throw new AppExceptions.BadRequestException("Invite is not pending");
        }

        clerkInvitationService.revokeInvitation(invite.getClerkInvitationId());

        invite.setStatus(CompanyInviteStatus.REVOKED);
        companyInviteRepository.save(invite);

        log.info("Cancelled company invite inviteId={} companyId={}", inviteId, companyId);
    }
}
