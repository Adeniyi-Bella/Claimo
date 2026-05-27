package com.claimo.api.projects.repository;

import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.models.PendingInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PendingInviteRepository extends JpaRepository<PendingInvite, UUID> {
    List<PendingInvite> findAllByEmail(String email);

    Optional<PendingInvite> findByClerkInvitationId(String clerkInvitationId);

    void deleteAllByEmail(String email);

    List<PendingInvite> findAllByProjectIdAndStatus(UUID projectId, PendingInviteStatus status);
}
