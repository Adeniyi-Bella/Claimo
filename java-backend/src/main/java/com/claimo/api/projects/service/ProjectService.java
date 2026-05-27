package com.claimo.api.projects.service;

import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.CreateUpdateProjectResponse;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.user.dto.DashboardResponse;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    CreateUpdateProjectResponse createProject(Jwt jwt, ProjectRequests.CreateProject request);

    List<ProjectResponses.ProjectDetails> getProjects(Jwt jwt);

    ProjectResponses.ProjectDetails getProjectById(Jwt jwt, UUID projectId);

    CreateUpdateProjectResponse updateProject(Jwt jwt, UUID projectId, ProjectRequests.UpdateProject request);

    void deleteProject(Jwt jwt, UUID projectId);

    DashboardResponse getDashboardData(Jwt jwt);
}
