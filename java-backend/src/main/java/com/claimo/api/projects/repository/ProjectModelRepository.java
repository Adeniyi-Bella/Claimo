package com.claimo.api.projects.repository;

import java.util.List;
import java.util.UUID;

import com.claimo.api.projects.models.ProjectModel;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectModelRepository extends JpaRepository<ProjectModel, UUID> {

    @EntityGraph(attributePaths = { "project", "uploadedBy" })
    List<ProjectModel> findAllByProject_IdIn(List<UUID> projectIds);
}
