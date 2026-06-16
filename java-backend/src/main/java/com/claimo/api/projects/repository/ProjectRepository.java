package com.claimo.api.projects.repository;

import com.claimo.api.projects.enums.ProjectStatus;
import com.claimo.api.projects.models.Project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
        @EntityGraph(attributePaths = { "company", "createdBy" })
        List<Project> findAllByCompanyId(UUID companyId);

        @EntityGraph(attributePaths = { "company", "createdBy" })
        List<Project> findAllByCompanyIdIn(List<UUID> companyIds);

        @EntityGraph(attributePaths = { "company", "createdBy" })
        Optional<Project> findById(UUID id);

        @EntityGraph(attributePaths = { "company", "createdBy" })
        @Query("""
                        SELECT p FROM Project p
                        WHERE (p.company.id IN :elevatedCompanyIds OR p.id IN :memberProjectIds)
                        AND (:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
                        AND (:status IS NULL OR p.status = :status)
                        """)
        Page<Project> findVisibleProjects(
                        @Param("elevatedCompanyIds") List<UUID> elevatedCompanyIds,
                        @Param("memberProjectIds") List<UUID> memberProjectIds,
                        @Param("q") String q,
                        @Param("status") ProjectStatus status,
                        Pageable pageable);
}
