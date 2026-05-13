package com.claimo.api.projects.service;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMemberService companyMemberService;
    private final UserService userService;

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
        log.info("Project created projectId={} companyId={}", saved.getId(), company.getId());
        return toResponse(saved);
    }

    @Override
    public List<ProjectResponses.Project> getProjects(Jwt jwt) {
        User user = getAuthenticatedUser(jwt);
        Company company = getOwnedCompany(user);
        return projectRepository.findAllByCompanyId(company.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ProjectResponses.Project getProjectById(Jwt jwt, UUID projectId) {
        User user = getAuthenticatedUser(jwt);
        Project project = getProjectForUser(projectId, user);
        return toResponse(project);
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
        return toResponse(saved);
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
     * Fetches a project and validates it belongs to the authenticated user's company.
     * Returns 404 if not found, 403 if it belongs to a different company.
     */
    private Project getProjectForUser(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        if (!companyMemberService.isMemberOfCompany(user.getId(), project.getCompany().getId())) {
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
    private ProjectResponses.Project toResponse(Project project) {
        return new ProjectResponses.Project(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getLocation(),
                project.getStartDate(),
                project.getCompany().getId(),
                project.getCreatedBy().getId(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
