package com.claimo.api.company.invites;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.company.model.CompanyInvite;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyInviteRepository extends JpaRepository<CompanyInvite, UUID> {
    List<CompanyInvite> findAllByEmail(String email);

    @EntityGraph(attributePaths = {"company", "invitedBy"})
    List<CompanyInvite> findAllByCompany_Id(UUID companyId);

    Optional<CompanyInvite> findByClerkInvitationId(String clerkInvitationId);
}
