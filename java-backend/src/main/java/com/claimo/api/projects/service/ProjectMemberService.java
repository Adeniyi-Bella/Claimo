package com.claimo.api.projects.service;

import com.claimo.api.projects.dto.ProjectMemberDto;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.user.model.User;



import java.util.List;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;

public interface ProjectMemberService {
    void addMember(Project project, User user, ProjectRole role);

    boolean isMember(java.util.UUID projectId, java.util.UUID userId);

    ProjectRole getRole(java.util.UUID projectId, java.util.UUID userId);

    List<ProjectMemberDto> getMembers(Jwt jwt, UUID projectId);

    void inviteMember(Jwt jwt, UUID projectId, ProjectRequests.InviteMember request);

    void removeMember(Jwt jwt, UUID projectId, UUID userId);
}