package com.claimo.api.projects.repository;

import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.models.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectMember> findAllByProjectId(UUID projectId);
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectMember> findAllByUserId(UUID userId);
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectMember> findAllByProject_Company_Id(UUID companyId);
    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectMember> findAllByProject_IdIn(List<UUID> projectIds);
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}
