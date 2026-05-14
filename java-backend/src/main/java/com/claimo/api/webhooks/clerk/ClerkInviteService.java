package com.claimo.api.webhooks.clerk;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.models.PendingInvite;
import com.claimo.api.projects.repository.PendingInviteRepository;
import com.claimo.api.projects.service.ProjectMemberService;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClerkInviteService {

    private final PendingInviteRepository pendingInviteRepository;
    private final CompanyMemberService companyMemberService;
    private final ProjectMemberService projectMemberService;

    @Transactional
    public void recordInvitationCreated(String email, String clerkInvitationId) {
        Optional<PendingInvite> invite = pendingInviteRepository.findByClerkInvitationId(clerkInvitationId);
        if (invite.isPresent()) {
            PendingInvite pendingInvite = invite.get();
            if (pendingInvite.getStatus() != PendingInviteStatus.PENDING) {
                pendingInvite.setStatus(PendingInviteStatus.PENDING);
                pendingInviteRepository.save(pendingInvite);
            }
            log.info("Processed invitation created event email={} invitationId={}", email, clerkInvitationId);
            return;
        }

        log.info("Received invitation created event with no local invite match email={} invitationId={}",
                email, clerkInvitationId);
    }

    @Transactional
    public void acceptInvitation(String email, String clerkInvitationId) {
        List<PendingInvite> invites = findInvites(clerkInvitationId, email);

        if (invites.isEmpty()) {
            log.warn("No pending invite found for accepted invitation email={} invitationId={}",
                    email, clerkInvitationId);
            return;
        }

        for (PendingInvite invite : invites) {
            acceptInvite(invite);
        }

        log.info("Processed invitation accepted event email={} invitationId={}", email, clerkInvitationId);
    }

    @Transactional
    public void acceptAndFinalizeInvitation(String email, String clerkInvitationId, User user) {
        List<PendingInvite> invites = findInvites(clerkInvitationId, email);

        if (invites.isEmpty()) {
            log.warn("No pending invite found while finalizing invitation email={} invitationId={}",
                    email, clerkInvitationId);
            return;
        }

        for (PendingInvite invite : invites) {
            acceptInvite(invite);
            finalizeInvite(invite, user);
        }
    }

    @Transactional
    public void markUserCreatedInvitesAccepted(String email, User user) {
        List<PendingInvite> invites = pendingInviteRepository.findAllByEmail(email);
        if (invites.isEmpty()) {
            return;
        }

        for (PendingInvite invite : invites) {
            acceptInvite(invite);
            finalizeInvite(invite, user);
        }
    }

    @Transactional
    public void logInvitationRevoked(String email, String clerkInvitationId) {
        log.info("Processed invitation revoked event email={} invitationId={}", email, clerkInvitationId);
    }

    public List<PendingInvite> findInvites(String clerkInvitationId, String email) {
        if (clerkInvitationId != null && !clerkInvitationId.isBlank()) {
            return pendingInviteRepository.findByClerkInvitationId(clerkInvitationId)
                    .map(List::of)
                    .orElseGet(() -> pendingInviteRepository.findAllByEmail(email));
        }
        return pendingInviteRepository.findAllByEmail(email);
    }

    private void acceptInvite(PendingInvite invite) {
        if (invite.getStatus() != PendingInviteStatus.ACCEPTED) {
            invite.setStatus(PendingInviteStatus.ACCEPTED);
            invite.setAcceptedAt(Instant.now());
            pendingInviteRepository.save(invite);
        }
    }

    private void finalizeInvite(PendingInvite invite, User user) {
        if (!companyMemberService.isMemberOfCompany(user.getId(), invite.getCompany().getId())) {
            companyMemberService.addMember(invite.getCompany(), user, CompanyRole.MEMBER);
        }

        if (!projectMemberService.isMember(invite.getProject().getId(), user.getId())) {
            projectMemberService.addMember(invite.getProject(), user, invite.getRole());
        }
    }
}
