package com.claimo.api.projects.service;

import com.claimo.api.auth.AuthHelper;
import com.claimo.api.company.model.Company;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.ProjectMemberDto;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.models.ProjectMemberId;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.claimo.api.company.repository.CompanyMemberRepository;
import com.claimo.api.integrations.clerk.ClerkInvitationService;

import com.claimo.api.projects.models.PendingInvite;
import com.claimo.api.projects.repository.PendingInviteRepository;
import com.claimo.api.user.service.UserService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectMemberServiceImpl implements ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final AuthHelper authHelper;
    private final PendingInviteRepository pendingInviteRepository;
    private final UserService userService;
    private final CompanyMemberRepository companyMemberRepository;
    private final ClerkInvitationService clerkInvitationService;

    /**
     * Gets project and validates caller is project ADMIN.
     */

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

    @Override
    @Transactional(readOnly = true)
    public List<ProjectMemberDto> getMembers(Jwt jwt, UUID projectId) {
        User user = authHelper.getAuthenticatedUser(jwt);
        getProjectForMember(projectId, user);

        return projectMemberRepository.findAllByProjectId(projectId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Gets project and validates caller is a project member.
     */
    private Project getProjectForMember(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        if (!isMember(projectId, user.getId())) {
            throw new AppExceptions.ForbiddenException("You are not a member of this project");
        }

        return project;
    }

    /**
     * Maps ProjectMember entity to ProjectMember response DTO.
     */
    private ProjectMemberDto toResponse(ProjectMember member) {
        return new ProjectMemberDto(
                member.getUser().getId(),
                member.getUser().getEmail(),
                member.getUser().getFirstName(),
                member.getUser().getLastName(),
                member.getRole(),
                member.getCreatedAt());
    }

    @Override
    @Transactional
    public void inviteMember(Jwt jwt, UUID projectId, ProjectRequests.InviteMember request) {
        User inviter = authHelper.getAuthenticatedUser(jwt);
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
            if (isMember(projectId, target.getId())) {
                throw new AppExceptions.ConflictException("User is already a member of this project");
            }

            if (companyMemberRepository.existsByUser_IdAndCompany_Id(target.getId(), company.getId())) {
                addMember(project, target, role);
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
    @Transactional
    public void removeMember(Jwt jwt, UUID projectId, UUID userId) {
        User requester = authHelper.getAuthenticatedUser(jwt);

        if (!isMember(projectId, requester.getId())) {
            throw new AppExceptions.ForbiddenException("You are not a member of this project");
        }

        ProjectRole requesterRole = getRole(projectId, requester.getId());
        ProjectRole targetRole = getRole(projectId, userId);

        boolean isSelf = requester.getId().equals(userId);

        switch (requesterRole) {
            case SUPER_ADMIN -> {
                if (isSelf) {
                    throw new AppExceptions.BadRequestException("Super admin cannot remove themselves from a project");
                }
            }
            case ADMIN -> {
                if (targetRole == ProjectRole.SUPER_ADMIN) {
                    throw new AppExceptions.ForbiddenException("Admins cannot remove the super admin");
                }
            }
            default -> {
                if (!isSelf) {
                    throw new AppExceptions.ForbiddenException("You can only remove yourself from this project");
                }
            }
        }

        projectMemberRepository.deleteById(new ProjectMemberId(projectId, userId));
        log.info("Removed member from project projectId={} userId={}", projectId, userId);
    }

    /**
     * Gets project and validates caller is project ADMIN.
     */
    private Project getProjectForAdmin(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        if (!isMember(projectId, user.getId())) {
            throw new AppExceptions.ForbiddenException("You are not a member of this project");
        }

        ProjectRole role = getRole(projectId, user.getId());
        if (role != ProjectRole.ADMIN && role != ProjectRole.SUPER_ADMIN) {
            log.info("User is not admin userId={} projectId={} role={}", user.getId(), projectId, role);
            throw new AppExceptions.ForbiddenException("Only project ADMINs can invite members");
        }

        return project;
    }
}