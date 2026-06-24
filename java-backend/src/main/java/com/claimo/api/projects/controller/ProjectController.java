package com.claimo.api.projects.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.CreateUpdateProjectResponse;
import com.claimo.api.projects.dto.response.DashboardResponse;
import com.claimo.api.projects.dto.response.GetProjectsResponse;
import com.claimo.api.projects.dto.response.PagedResponse;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.projects.service.ProjectService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management")
public class ProjectController {

        private final ProjectService projectService;

        @PostMapping
        @Operation(summary = "Create a new project", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Project created successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request body"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<CustomApiResponse<CreateUpdateProjectResponse>> createProject(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody ProjectRequests.CreateProject request) {
                CreateUpdateProjectResponse response = projectService.createProject(jwt, request);
                return ResponseEntity.status(HttpStatus.CREATED).body(CustomApiResponse.success(response));
        }

        @GetMapping
        @Operation(summary = "Get all projects for authenticated user's company", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Projects returned successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        public ResponseEntity<CustomApiResponse<PagedResponse<GetProjectsResponse>>> getProjects(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam(required = false) String q,
                        @RequestParam(required = false) String status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int pageSize) {
                Page<GetProjectsResponse> response = projectService.getProjects(jwt, q, status, page, pageSize);
                return ResponseEntity.ok(CustomApiResponse.success(PagedResponse.from(response)));
        }

        @GetMapping("/{projectId}")
        @Operation(summary = "Get a project by ID", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Project returned successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Project not found")
        })
        public ResponseEntity<CustomApiResponse<ProjectResponses.ProjectDetails>> getProjectById(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId) {
                ProjectResponses.ProjectDetails response = projectService.getProjectById(jwt, projectId);
                return ResponseEntity.ok(CustomApiResponse.success(response));
        }

        @PutMapping("/{projectId}")
        @Operation(summary = "Update a project", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Project updated successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request body"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Project not found")
        })
        public ResponseEntity<CustomApiResponse<CreateUpdateProjectResponse>> updateProject(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @Valid @RequestBody ProjectRequests.UpdateProject request) {
                CreateUpdateProjectResponse response = projectService.updateProject(jwt, projectId, request);
                return ResponseEntity.ok(CustomApiResponse.success(response));
        }

        @DeleteMapping("/{projectId}")
        @Operation(summary = "Delete a project", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Project not found")
        })
        public ResponseEntity<Void> deleteProject(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId) {
                projectService.deleteProject(jwt, projectId);
                return ResponseEntity.noContent().build();
        }

        @GetMapping("/dashboard")
        @Operation(summary = "Get dashboard data for authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Dashboard returned successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "404", description = "User or company not found")
        })
        public ResponseEntity<CustomApiResponse<DashboardResponse>> getDashboardData(
                        @AuthenticationPrincipal Jwt jwt) {
                DashboardResponse response = projectService.getDashboardData(jwt);
                return ResponseEntity.ok(CustomApiResponse.success(response));
        }
}