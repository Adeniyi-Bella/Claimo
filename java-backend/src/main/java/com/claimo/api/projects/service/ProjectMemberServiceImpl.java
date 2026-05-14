package com.claimo.api.projects.service;

import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.models.ProjectMemberId;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectMemberServiceImpl implements ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;

    @Override
    @Transactional
    public void addMember(Project project, User user, ProjectRole role) {
        ProjectMemberId id = new ProjectMemberId(project.getId(), user.getId());

        if (projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
            log.warn("User already member of project projectId={} userId={}", 
                    project.getId(), user.getId());
            throw new AppExceptions.ConflictException("User is already a member of this project");
        }

        ProjectMember member = new ProjectMember();
        member.setId(id);
        member.setProject(project);
        member.setUser(user);
        member.setRole(role);

        projectMemberRepository.save(member);
        log.info("Member added projectId={} userId={} role={}", 
                project.getId(), user.getId(), role);
    }

    @Override
    public boolean isMember(UUID projectId, UUID userId) {
        return projectMemberRepository.existsByProjectIdAndUserId(projectId, userId);
    }

    @Override
    public ProjectRole getRole(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(ProjectMember::getRole)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Member not found for projectId=" + projectId + " userId=" + userId));
    }
}