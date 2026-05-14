package com.claimo.api.projects.service;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final UserService userService;
    private final ProjectMemberService projectMemberService;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    @Transactional
    public ProjectResponses.Project createProject(Jwt jwt, ProjectRequests.CreateProject request) {
        User user = getAuthenticatedUser(jwt);
        Company company = getOwnedCompany(user);

        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setLocation(request.location());
        project.setStartDate(request.startDate());
        project.setCompany(company);
        project.setCreatedBy(user);

        Project saved = projectRepository.save(project);

        projectMemberService.addMember(saved, user, ProjectRole.ADMIN);

        log.info("Project created projectId={} companyId={}", saved.getId(), company.getId());
        return toResponse(saved, user);
    }

    @Override
    public List<ProjectResponses.Project> getProjects(Jwt jwt) {
        User user = getAuthenticatedUser(jwt);
        List<ProjectMember> memberships = projectMemberRepository.findAllByUserId(user.getId());
        if (memberships.isEmpty()) {
            return List.of();
        }

        return memberships.stream()
                .map(ProjectMember::getProject)
                .collect(Collectors.toMap(
                        Project::getId,
                        project -> project,
                        (first, second) -> first,
                        java.util.LinkedHashMap::new))
                .values()
                .stream()
                .map(project -> toResponse(project, user))
                .toList();
    }

    @Override
    public ProjectResponses.Project getProjectById(Jwt jwt, UUID projectId) {
        User user = getAuthenticatedUser(jwt);
        Project project = getProjectForUser(projectId, user);
        return toResponse(project, user);
    }

    @Override
    @Transactional
    public ProjectResponses.Project updateProject(Jwt jwt, UUID projectId, ProjectRequests.UpdateProject request) {
        User user = getAuthenticatedUser(jwt);
        Project project = getProjectForUser(projectId, user);

        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());
        if (request.location() != null) project.setLocation(request.location());
        if (request.startDate() != null) project.setStartDate(request.startDate());

        Project saved = projectRepository.save(project);
        log.info("Project updated projectId={}", saved.getId());
        return toResponse(saved, user);
    }

    @Override
    @Transactional
    public void deleteProject(Jwt jwt, UUID projectId) {
        User user = getAuthenticatedUser(jwt);
        Project project = getProjectForUser(projectId, user);
        projectRepository.delete(project);
        log.info("Project deleted projectId={}", projectId);
    }

    /**
     * Fetches the authenticated user from the JWT subject claim.
     */
    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

    /**
     * Fetches a project and validates the authenticated user is a project member.
     * Returns 404 if not found, 403 if the user is not in project_members.
     */
    private Project getProjectForUser(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        if (!projectMemberService.isMember(projectId, user.getId())) {
            throw new AppExceptions.ForbiddenException(
                    "Access denied to project: " + projectId);
        }
        return project;
    }

    private Company getOwnedCompany(User user) {
        return companyRepository.findByOwner_Id(user.getId())
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Company not found for owner userId: " + user.getId()));
    }

    /**
     * Maps a Project entity to a ProjectResponse DTO.
     */
    private ProjectResponses.Project toResponse(Project project, User user) {
        ProjectRole role = null;
        if (projectMemberService.isMember(project.getId(), user.getId())) {
            role = projectMemberService.getRole(project.getId(), user.getId());
        }

        return new ProjectResponses.Project(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getLocation(),
                project.getStartDate(),
                project.getCompany().getId(),
                project.getCreatedBy().getId(),
                role,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
