package com.claimo.api.projects.service;

import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.ProjectResponses;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    ProjectResponses.Project createProject(Jwt jwt, ProjectRequests.CreateProject request);

    List<ProjectResponses.Project> getProjects(Jwt jwt);

    ProjectResponses.Project getProjectById(Jwt jwt, UUID projectId);

    ProjectResponses.Project updateProject(Jwt jwt, UUID projectId, ProjectRequests.UpdateProject request);

    void deleteProject(Jwt jwt, UUID projectId);
}