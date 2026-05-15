package com.claimo.api.company.invites;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyInviteRepository extends JpaRepository<CompanyInvite, UUID> {
    List<CompanyInvite> findAllByEmail(String email);
    Optional<CompanyInvite> findByClerkInvitationId(String clerkInvitationId);
}
