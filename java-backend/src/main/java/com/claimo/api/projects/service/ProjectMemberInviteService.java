package com.claimo.api.projects.service;


import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.ProjectResponses;

import java.util.List;
import java.util.UUID;

public interface ProjectMemberInviteService {
    void inviteMember(Jwt jwt, UUID projectId, ProjectRequests.InviteMember request);
    List<ProjectResponses.ProjectMember> getMembers(Jwt jwt, UUID projectId);
    void removeMember(Jwt jwt, UUID projectId, UUID userId);
}