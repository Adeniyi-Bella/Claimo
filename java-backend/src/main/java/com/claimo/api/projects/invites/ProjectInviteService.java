package com.claimo.api.projects.invites;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.repository.CompanyMemberRepository;
import com.claimo.api.company.services.CompanyService;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.models.PendingInvite;
import com.claimo.api.projects.repository.PendingInviteRepository;
import com.claimo.api.projects.service.ProjectMemberService;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectInviteService {

    private final PendingInviteRepository pendingInviteRepository;
    private final CompanyService companyService;
    private final ProjectMemberService projectMemberService;
    private final CompanyMemberRepository companyMemberRepository;

    @Transactional
    public void recordInvitationCreated(String email, String clerkInvitationId) {
        Optional<PendingInvite> invite = pendingInviteRepository.findByClerkInvitationId(clerkInvitationId);
        if (invite.isPresent()) {
            PendingInvite pendingInvite = invite.get();
            if (pendingInvite.getStatus() != PendingInviteStatus.PENDING) {
                pendingInvite.setStatus(PendingInviteStatus.PENDING);
                pendingInviteRepository.save(pendingInvite);
            }
            log.info("Processed project invitation created event email={} invitationId={}", email, clerkInvitationId);
            return;
        }

        log.info("Received project invitation created event with no local invite match email={} invitationId={}",
                email, clerkInvitationId);
    }

    @Transactional
    public void acceptInvitation(String email, String clerkInvitationId) {
        List<PendingInvite> invites = findInvites(clerkInvitationId, email);

        if (invites.isEmpty()) {
            log.warn("No project invite found for accepted invitation email={} invitationId={}",
                    email, clerkInvitationId);
            return;
        }

        for (PendingInvite invite : invites) {
            acceptInvite(invite);
        }

        log.info("Processed project invitation accepted event email={} invitationId={}", email, clerkInvitationId);
    }

    @Transactional
    public void acceptAndFinalizeInvitation(String email, String clerkInvitationId, User user) {
        List<PendingInvite> invites = findInvites(clerkInvitationId, email);

        if (invites.isEmpty()) {
            log.warn("No project invite found while finalizing invitation email={} invitationId={}",
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
        List<PendingInvite> invites = pendingInviteRepository.findAllByEmail(email).stream()
                .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                .toList();
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
        List<PendingInvite> invites = findInvites(clerkInvitationId, email);
        for (PendingInvite invite : invites) {
            invite.setStatus(PendingInviteStatus.REVOKED);
            pendingInviteRepository.save(invite);
        }
        log.info("Processed project invitation revoked event email={} invitationId={}", email, clerkInvitationId);
    }

    public boolean hasPendingInvites(String email) {
        return pendingInviteRepository.findAllByEmail(email).stream()
                .anyMatch(invite -> invite.getStatus() != PendingInviteStatus.REVOKED);
    }

    public List<PendingInvite> findInvites(String clerkInvitationId, String email) {
        if (clerkInvitationId != null && !clerkInvitationId.isBlank()) {
            return pendingInviteRepository.findByClerkInvitationId(clerkInvitationId)
                    .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                    .map(List::of)
                    .orElseGet(() -> pendingInviteRepository.findAllByEmail(email).stream()
                            .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                            .toList());
        }
        return pendingInviteRepository.findAllByEmail(email).stream()
                .filter(invite -> invite.getStatus() != PendingInviteStatus.REVOKED)
                .toList();
    }

    private void acceptInvite(PendingInvite invite) {
        if (invite.getStatus() != PendingInviteStatus.ACCEPTED) {
            invite.setStatus(PendingInviteStatus.ACCEPTED);
            invite.setAcceptedAt(Instant.now());
            pendingInviteRepository.save(invite);
        }
    }

    private void finalizeInvite(PendingInvite invite, User user) {
        log.info("Finalizing invite for email={} projectId={} userId={}",
                invite.getEmail(), invite.getProject().getId(), user.getId());

        try {
            if (!companyMemberRepository.existsByUser_IdAndCompany_Id(user.getId(), invite.getCompany().getId())) {
                companyService.addMember(invite.getCompany(), user, CompanyRole.MEMBER);
                log.info("Added user to company companyId={}", invite.getCompany().getId());
            }

            if (!projectMemberService.isMember(invite.getProject().getId(), user.getId())) {
                projectMemberService.addMember(invite.getProject(), user, invite.getRole());
                log.info("Added user to project projectId={}", invite.getProject().getId());
            }
        } catch (DataIntegrityViolationException e) {
            log.warn("Duplicate finalize attempt ignored for email={} projectId={} — likely concurrent webhook",
                    invite.getEmail(), invite.getProject().getId());
        }
    }
}
