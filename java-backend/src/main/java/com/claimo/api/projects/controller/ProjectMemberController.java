package com.claimo.api.projects.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.projects.dto.ProjectMemberDto;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.service.ProjectMemberService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@RequiredArgsConstructor
@Tag(name = "Project Members", description = "Project member management")
public class ProjectMemberController {

        private final ProjectMemberService projectMemberService;

        @PostMapping
        @Operation(summary = "Invite a member to a project", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Member invited successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request body"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied — must be project ADMIN"),
                        @ApiResponse(responseCode = "404", description = "Project not found"),
                        @ApiResponse(responseCode = "409", description = "User already a member")
        })
        public ResponseEntity<CustomApiResponse<Void>> inviteMember(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @Valid @RequestBody ProjectRequests.InviteMember request) {
                projectMemberService.inviteMember(jwt, projectId, request);
                return ResponseEntity.status(HttpStatus.CREATED).body(CustomApiResponse.success(null));
        }

        @GetMapping
        @Operation(summary = "Get all members of a project", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Members returned successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Project not found")
        })
        public ResponseEntity<CustomApiResponse<List<ProjectMemberDto>>> getMembers(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId) {
                List<ProjectMemberDto> members = projectMemberService.getMembers(jwt, projectId);
                return ResponseEntity.ok(CustomApiResponse.success(members));
        }

        @DeleteMapping("/{userId}")
        @Operation(summary = "Remove a member from a project", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Member removed successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied — must be project ADMIN"),
                        @ApiResponse(responseCode = "404", description = "Project or member not found")
        })
        public ResponseEntity<Void> removeMember(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID userId) {
                projectMemberService.removeMember(jwt, projectId, userId);
                return ResponseEntity.noContent().build();
        }
}