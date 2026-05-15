package com.claimo.api.company.invites;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.company.model.Company;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.integrations.clerk.ClerkInvitationService;
import com.claimo.api.projects.enums.PendingInviteStatus;
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

    @Transactional
    public void inviteMember(Jwt jwt, UUID companyId, String email, CompanyRole role) {
        User inviter = getAuthenticatedUser(jwt);
        Company company = getCompanyForAdmin(companyId, inviter);

        String normalizedEmail = email.toLowerCase().trim();

        if (inviter.getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new AppExceptions.BadRequestException("You cannot invite yourself to a company");
        }

        Optional<User> existingUser = userService.findByEmail(normalizedEmail);
        if (existingUser.isPresent() && companyMemberService.isMemberOfCompany(existingUser.get().getId(), companyId)) {
            throw new AppExceptions.ConflictException("User is already a member of this company");
        }

        CompanyInvite invite = new CompanyInvite();
        invite.setEmail(normalizedEmail);
        invite.setCompany(company);
        invite.setRole(role);
        invite.setStatus(PendingInviteStatus.PENDING);
        invite.setInvitedBy(inviter);
        companyInviteRepository.save(invite);

        String clerkInvitationId = clerkInvitationService.sendInvitation(normalizedEmail);
        invite.setClerkInvitationId(clerkInvitationId);
        companyInviteRepository.save(invite);

        log.info("Stored company invite email={} companyId={} clerkInvitationId={}",
                normalizedEmail, companyId, clerkInvitationId);
    }

    @Transactional
    public void recordInvitationCreated(String email, String clerkInvitationId) {
        companyInviteRepository.findByClerkInvitationId(clerkInvitationId).ifPresent(invite -> {
            if (invite.getStatus() != PendingInviteStatus.PENDING) {
                invite.setStatus(PendingInviteStatus.PENDING);
                companyInviteRepository.save(invite);
            }
            log.info("Processed company invitation created event email={} invitationId={}", email, clerkInvitationId);
        });
    }

    @Transactional
    public void acceptInvitation(String email, String clerkInvitationId) {
        List<CompanyInvite> invites = findInvites(clerkInvitationId, email);
        if (invites.isEmpty()) {
            log.warn("No company invite found for accepted invitation email={} invitationId={}", email, clerkInvitationId);
            return;
        }

        for (CompanyInvite invite : invites) {
            acceptInvite(invite);
        }

        log.info("Processed company invitation accepted event email={} invitationId={}", email, clerkInvitationId);
    }

    @Transactional
    public void acceptAndFinalizeInvitation(String email, String clerkInvitationId, User user) {
        List<CompanyInvite> invites = findInvites(clerkInvitationId, email);
        if (invites.isEmpty()) {
            log.warn("No company invite found while finalizing invitation email={} invitationId={}", email, clerkInvitationId);
            return;
        }

        for (CompanyInvite invite : invites) {
            acceptInvite(invite);
            finalizeInvite(invite, user);
        }
    }

    @Transactional
    public void markUserCreatedInvitesAccepted(String email, User user) {
        List<CompanyInvite> invites = companyInviteRepository.findAllByEmail(email).stream()
                .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                .toList();
        if (invites.isEmpty()) {
            return;
        }

        for (CompanyInvite invite : invites) {
            acceptInvite(invite);
            finalizeInvite(invite, user);
        }
    }

    @Transactional
    public void revokeInvitation(String email, String clerkInvitationId) {
        findInvites(clerkInvitationId, email).forEach(invite -> {
            invite.setStatus(PendingInviteStatus.REVOKED);
            companyInviteRepository.save(invite);
        });
        log.info("Processed company invitation revoked event email={} invitationId={}", email, clerkInvitationId);
    }

    public boolean hasPendingInvites(String email) {
        return companyInviteRepository.findAllByEmail(email).stream()
                .anyMatch(invite -> invite.getStatus() != PendingInviteStatus.REVOKED);
    }

    public List<CompanyInvite> findInvites(String clerkInvitationId, String email) {
        if (clerkInvitationId != null && !clerkInvitationId.isBlank()) {
            return companyInviteRepository.findByClerkInvitationId(clerkInvitationId)
                    .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                    .map(List::of)
                    .orElseGet(() -> companyInviteRepository.findAllByEmail(email).stream()
                            .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                            .toList());
        }
        return companyInviteRepository.findAllByEmail(email).stream()
                .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                .toList();
    }

    private void acceptInvite(CompanyInvite invite) {
        if (invite.getStatus() != PendingInviteStatus.ACCEPTED) {
            invite.setStatus(PendingInviteStatus.ACCEPTED);
            invite.setAcceptedAt(Instant.now());
            companyInviteRepository.save(invite);
        }
    }

    private void finalizeInvite(CompanyInvite invite, User user) {
        if (!companyMemberService.isMemberOfCompany(user.getId(), invite.getCompany().getId())) {
            companyMemberService.addMember(invite.getCompany(), user, invite.getRole());
        }
    }

    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

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
}
