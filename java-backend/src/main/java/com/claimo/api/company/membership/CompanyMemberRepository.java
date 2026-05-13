package com.claimo.api.company.membership;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, CompanyMemberId> {
    @EntityGraph(attributePaths = "company")
    List<CompanyMember> findAllByUser_Id(UUID userId);

    boolean existsByUser_IdAndCompany_Id(UUID userId, UUID companyId);
}
