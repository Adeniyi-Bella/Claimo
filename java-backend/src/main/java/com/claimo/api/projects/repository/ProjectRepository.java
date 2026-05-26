package com.claimo.api.projects.repository;

import com.claimo.api.projects.models.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    @EntityGraph(attributePaths = {"company", "createdBy"})
    List<Project> findAllByCompanyId(UUID companyId);

    @EntityGraph(attributePaths = {"company", "createdBy"})
    List<Project> findAllByCompanyIdIn(List<UUID> companyIds);

    @EntityGraph(attributePaths = {"company", "createdBy"})
    Optional<Project> findById(UUID id);
}
