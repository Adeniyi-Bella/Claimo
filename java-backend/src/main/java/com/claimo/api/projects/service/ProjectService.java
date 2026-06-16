package com.claimo.api.projects.service;

import org.springframework.data.domain.Page;
import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.CreateUpdateProjectResponse;
import com.claimo.api.projects.dto.response.DashboardResponse;
import com.claimo.api.projects.dto.response.GetProjectsResponse;
import com.claimo.api.projects.dto.response.ProjectResponses;

import java.util.UUID;

public interface ProjectService {
    CreateUpdateProjectResponse createProject(Jwt jwt, ProjectRequests.CreateProject request);

    Page<GetProjectsResponse> getProjects(Jwt jwt, String q, String status, int page, int pageSize);

    ProjectResponses.ProjectDetails getProjectById(Jwt jwt, UUID projectId);

    CreateUpdateProjectResponse updateProject(Jwt jwt, UUID projectId, ProjectRequests.UpdateProject request);

    void deleteProject(Jwt jwt, UUID projectId);

    DashboardResponse getDashboardData(Jwt jwt);
}
