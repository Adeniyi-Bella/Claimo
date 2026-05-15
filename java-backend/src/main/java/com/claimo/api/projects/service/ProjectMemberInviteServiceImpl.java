package com.claimo.api.projects.service;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.integrations.clerk.ClerkInvitationService;

import com.claimo.api.projects.models.PendingInvite;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.repository.PendingInviteRepository;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectMemberInviteServiceImpl implements ProjectMemberInviteService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PendingInviteRepository pendingInviteRepository;
    private final UserService userService;
    private final CompanyMemberService companyMemberService;
    private final ProjectMemberService projectMemberService;
    private final ClerkInvitationService clerkInvitationService;

    @Override
    @Transactional
    public void inviteMember(Jwt jwt, UUID projectId, ProjectRequests.InviteMember request) {
        User inviter = getAuthenticatedUser(jwt);
        Project project = getProjectForAdmin(projectId, inviter);
        Company company = project.getCompany();

        String email = request.email().toLowerCase().trim();
        ProjectRole role = request.role();

        // Check if inviter is trying to invite themselves
        if (inviter.getEmail().equalsIgnoreCase(email)) {
            throw new AppExceptions.BadRequestException("You cannot invite yourself to a project");
        }

        Optional<User> existingUser = userService.findByEmail(email);
        if (existingUser.isPresent()) {
            User target = existingUser.get();
            if (projectMemberService.isMember(projectId, target.getId())) {
                throw new AppExceptions.ConflictException("User is already a member of this project");
            }

            if (companyMemberService.isMemberOfCompany(target.getId(), company.getId())) {
                projectMemberService.addMember(project, target, role);
                log.info("Added existing company member directly to project email={} projectId={}", email, projectId);
                return;
            }
        }

        PendingInvite invite = new PendingInvite();
        invite.setEmail(email);
        invite.setProject(project);
        invite.setCompany(company);
        invite.setRole(role);
        invite.setStatus(PendingInviteStatus.PENDING);
        invite.setInvitedBy(inviter);
        pendingInviteRepository.save(invite);

        String clerkInvitationId = clerkInvitationService.sendInvitation(email);
        invite.setClerkInvitationId(clerkInvitationId);
        pendingInviteRepository.save(invite);

        log.info("Stored pending invite for email={} projectId={} clerkInvitationId={}",
                email, projectId, clerkInvitationId);
    }

    @Override
    public List<ProjectResponses.ProjectMember> getMembers(Jwt jwt, UUID projectId) {
        User user = getAuthenticatedUser(jwt);
        getProjectForMember(projectId, user);

        return projectMemberRepository.findAllByProjectId(projectId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void removeMember(Jwt jwt, UUID projectId, UUID userId) {
        User admin = getAuthenticatedUser(jwt);
        getProjectForAdmin(projectId, admin);

        if (!projectMemberService.isMember(projectId, userId)) {
            throw new AppExceptions.ResourceNotFoundException("Member not found in project");
        }

        // Prevent removing yourself
        if (admin.getId().equals(userId)) {
            throw new AppExceptions.BadRequestException("You cannot remove yourself from a project");
        }

        projectMemberRepository.deleteById(
                new com.claimo.api.projects.models.ProjectMemberId(projectId, userId));
        log.info("Removed member from project projectId={} userId={}", projectId, userId);
    }

    /**
     * Gets authenticated user from JWT.
     */
    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

    /**
     * Gets project and validates caller is project ADMIN.
     */
    private Project getProjectForAdmin(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        if (!projectMemberService.isMember(projectId, user.getId())) {
            throw new AppExceptions.ForbiddenException("You are not a member of this project");
        }

        ProjectRole role = projectMemberService.getRole(projectId, user.getId());
        if (role != ProjectRole.ADMIN) {
            throw new AppExceptions.ForbiddenException("Only project ADMINs can invite members");
        }

        return project;
    }

    /**
     * Gets project and validates caller is a project member.
     */
    private Project getProjectForMember(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        if (!projectMemberService.isMember(projectId, user.getId())) {
            throw new AppExceptions.ForbiddenException("You are not a member of this project");
        }

        return project;
    }

    /**
     * Maps ProjectMember entity to ProjectMember response DTO.
     */
    private ProjectResponses.ProjectMember toResponse(ProjectMember member) {
        return new ProjectResponses.ProjectMember(
                member.getUser().getId(),
                member.getUser().getEmail(),
                member.getUser().getFirstName(),
                member.getUser().getLastName(),
                member.getRole(),
                member.getCreatedAt()
        );
    }
}
