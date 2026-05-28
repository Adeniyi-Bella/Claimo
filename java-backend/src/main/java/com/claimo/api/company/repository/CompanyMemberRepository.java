package com.claimo.api.company.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.company.model.CompanyMember;
import com.claimo.api.company.model.CompanyMemberId;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, CompanyMemberId> {
    @EntityGraph(attributePaths = "company")
    List<CompanyMember> findAllByUser_Id(UUID userId);

    @EntityGraph(attributePaths = "user")
    List<CompanyMember> findAllByCompany_Id(UUID companyId);

    Optional<CompanyMember> findByCompany_IdAndUser_Id(UUID companyId, UUID userId);

    boolean existsByUser_IdAndCompany_Id(UUID userId, UUID companyId);
}
