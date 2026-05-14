package com.claimo.api.projects.service;

import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.user.model.User;

public interface ProjectMemberService {
    void addMember(Project project, User user, ProjectRole role);
    boolean isMember(java.util.UUID projectId, java.util.UUID userId);
    ProjectRole getRole(java.util.UUID projectId, java.util.UUID userId);
}