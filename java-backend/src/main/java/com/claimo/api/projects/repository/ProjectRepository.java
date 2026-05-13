package com.claimo.api.projects.repository;

import com.claimo.api.projects.models.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findAllByCompanyId(UUID companyId);
}