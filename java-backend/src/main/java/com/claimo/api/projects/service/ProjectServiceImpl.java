package com.claimo.api.projects.service;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.membership.CompanyMember;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.projects.dto.response.ProjectResponses.AuditEntry;
import com.claimo.api.projects.dto.response.ProjectResponses.Claim;
import com.claimo.api.projects.dto.response.ProjectResponses.Member;
import com.claimo.api.projects.dto.response.ProjectResponses.Model;
import com.claimo.api.projects.dto.response.ProjectResponses.PaymentItemResponse;
import com.claimo.api.projects.dto.response.ProjectResponses.ProjectDetails;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.models.ProjectModel;
import com.claimo.api.projects.models.PaymentItem;
import com.claimo.api.projects.models.PaymentItemAuditEntry;
import com.claimo.api.projects.models.PaymentItemClaim;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.projects.repository.ProjectModelRepository;
import com.claimo.api.projects.repository.PaymentItemRepository;
import com.claimo.api.projects.repository.PendingInviteRepository;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

        private final ProjectRepository projectRepository;
        private final CompanyRepository companyRepository;
        private final UserService userService;
        private final CompanyMemberService companyMemberService;
        private final ProjectMemberService projectMemberService;
        private final ProjectMemberRepository projectMemberRepository;
        private final ProjectModelRepository projectModelRepository;
        private final PaymentItemRepository paymentItemRepository;
        private final PendingInviteRepository pendingInviteRepository;

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

        /**
         * Retrieves all projects visible to the authenticated user.
         *
         * Visibility rules:
         * - Company ACCOUNT_OWNER or ADMIN can see all projects within their company
         * - Any user can see projects they are explicitly added to as a project member
         *
         * Data is batched to avoid N+1 queries:
         * - Members, models, and payment items are all fetched in single IN-clause
         * queries
         *
         * @param jwt the JWT token of the authenticated user
         * @return a list of ProjectDetails sorted by creation date descending
         */
        @Override
        public List<ProjectDetails> getProjects(Jwt jwt) {
                User user = getAuthenticatedUser(jwt);

                // Fetch all company memberships for this user to determine elevated access
                List<CompanyMember> companyMemberships = companyMemberService.findByUserId(user.getId());

                // Extract company IDs where the user has elevated roles (ACCOUNT_OWNER or
                // ADMIN)
                // These users can see all projects under those companies
                Set<UUID> elevatedCompanyIds = companyMemberships.stream()
                                .filter(member -> member.getRole() == CompanyRole.ACCOUNT_OWNER
                                                || member.getRole() == CompanyRole.ADMIN)
                                .map(member -> member.getCompany().getId())
                                .collect(java.util.stream.Collectors.toSet());

                // Use LinkedHashMap to deduplicate projects while preserving insertion order
                LinkedHashMap<UUID, Project> visibleProjects = new LinkedHashMap<>();

                // Add all projects belonging to companies where the user has elevated access
                if (!elevatedCompanyIds.isEmpty()) {
                        projectRepository.findAllByCompanyIdIn(List.copyOf(elevatedCompanyIds))
                                        .forEach(project -> visibleProjects.putIfAbsent(project.getId(), project));
                }

                // Add projects where the user is an explicit project member
                // putIfAbsent ensures we don't overwrite projects already added via company
                // access
                projectMemberRepository.findAllByUserId(user.getId())
                                .stream()
                                .map(ProjectMember::getProject)
                                .forEach(project -> visibleProjects.putIfAbsent(project.getId(), project));

                // Early return if user has no projects
                if (visibleProjects.isEmpty()) {
                        return List.of();
                }

                List<UUID> projectIds = new ArrayList<>(visibleProjects.keySet());

                // Fetch all related data in single queries
                Map<UUID, List<ProjectMember>> membersByProject = projectMemberRepository
                                .findAllByProject_IdIn(projectIds)
                                .stream()
                                .collect(Collectors.groupingBy(
                                                member -> member.getProject().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));

                Map<UUID, List<ProjectModel>> modelsByProject = projectModelRepository.findAllByProject_IdIn(projectIds)
                                .stream()
                                .collect(Collectors.groupingBy(
                                                model -> model.getProject().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));
                Map<UUID, List<PaymentItem>> paymentItemsByProject = paymentItemRepository
                                .findAllByProject_IdIn(projectIds).stream()
                                .collect(Collectors.groupingBy(
                                                item -> item.getProject().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));

                // Map each project to its full details, sorted by creation date descending
                // Null creation dates are pushed to the end
                return visibleProjects.values().stream()
                                .sorted(Comparator.comparing(Project::getCreatedAt,
                                                Comparator.nullsLast(Comparator.reverseOrder())))
                                .map(project -> toDetails(
                                                project,
                                                membersByProject.getOrDefault(project.getId(), List.of()),
                                                modelsByProject.getOrDefault(project.getId(), List.of()),
                                                paymentItemsByProject.getOrDefault(project.getId(), List.of()),
                                                List.of(), null, null))
                                .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public ProjectResponses.ProjectDetails getProjectById(Jwt jwt, UUID projectId) {
                User user = getAuthenticatedUser(jwt);
                Project project = getProjectForView(projectId, user);
                List<ProjectMember> members = projectMemberRepository.findAllByProjectId(projectId);

                ProjectRole currentUserRole = members.stream()
                                .filter(m -> m.getUser().getId().equals(user.getId()))
                                .map(ProjectMember::getRole)
                                .findFirst()
                                .orElse(null);

                CompanyRole currentUserCompanyRole = companyMemberService
                                .findByUserId(user.getId()).stream()
                                .filter(m -> m.getCompany().getId().equals(project.getCompany().getId()))
                                .map(CompanyMember::getRole)
                                .findFirst()
                                .orElse(null);

                return toDetails(
                                project,
                                members,
                                projectModelRepository.findAllByProject_IdIn(List.of(projectId)),
                                paymentItemRepository.findAllByProject_IdIn(List.of(projectId)),
                                pendingInviteRepository.findAllByProjectIdAndStatus(projectId,
                                                PendingInviteStatus.PENDING),
                                currentUserRole,
                                currentUserCompanyRole);
        }

        @Override
        @Transactional
        public ProjectResponses.Project updateProject(Jwt jwt, UUID projectId, ProjectRequests.UpdateProject request) {
                User user = getAuthenticatedUser(jwt);
                Project project = getProjectForProjectAdmin(projectId, user);

                if (request.name() != null)
                        project.setName(request.name());
                if (request.description() != null)
                        project.setDescription(request.description());
                if (request.location() != null)
                        project.setLocation(request.location());
                if (request.startDate() != null)
                        project.setStartDate(request.startDate());

                Project saved = projectRepository.save(project);
                log.info("Project updated projectId={}", saved.getId());
                return toResponse(saved, user);
        }

        @Override
        @Transactional
        public void deleteProject(Jwt jwt, UUID projectId) {
                User user = getAuthenticatedUser(jwt);
                Project project = getProjectForProjectAdmin(projectId, user);
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
        private Project getProjectForView(UUID projectId, User user) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Project not found: " + projectId));

                if (projectMemberService.isMember(projectId, user.getId())) {
                        return project;
                }

                if (canViewAllProjectsInCompany(project.getCompany().getId(), user.getId())) {
                        return project;
                }

                throw new AppExceptions.ForbiddenException(
                                "Access denied to project: " + projectId);
        }

        private Project getProjectForProjectAdmin(UUID projectId, User user) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Project not found: " + projectId));

                if (!projectMemberService.isMember(projectId, user.getId())) {
                        throw new AppExceptions.ForbiddenException(
                                        "Access denied to project: " + projectId);
                }
                ProjectRole role = projectMemberService.getRole(projectId, user.getId());
                if (role != ProjectRole.ADMIN) {
                        throw new AppExceptions.ForbiddenException("Only project ADMINs can manage projects");
                }
                return project;
        }

        private boolean canViewAllProjectsInCompany(UUID companyId, UUID userId) {
                return companyMemberService.findByUserId(userId).stream()
                                .filter(member -> member.getCompany().getId().equals(companyId))
                                .anyMatch(member -> member.getRole() == CompanyRole.ACCOUNT_OWNER
                                                || member.getRole() == CompanyRole.ADMIN);
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
                                project.getUpdatedAt());
        }

        private ProjectDetails toDetails(
                        Project project,
                        List<ProjectMember> members,
                        List<ProjectModel> models,
                        List<PaymentItem> paymentItems,
                        List<com.claimo.api.projects.models.PendingInvite> pendingInvites,
                        ProjectRole currentUserRole,
                        CompanyRole currentUserCompanyRole) {

                Map<UUID, List<PaymentItem>> paymentItemsByModel = paymentItems.stream()
                                .collect(Collectors.groupingBy(
                                                item -> item.getModel().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));

                List<Member> memberDtos = members.stream()
                                .map(member -> {
                                        User memberUser = member.getUser();
                                        return new Member(
                                                        memberUser.getId(),
                                                        displayName(memberUser),
                                                        memberUser.getEmail(),
                                                        member.getRole(),
                                                        member.getCreatedAt() == null ? null
                                                                        : member.getCreatedAt().atOffset(ZoneOffset.UTC)
                                                                                        .toString(),
                                                        avatarHue(memberUser.getEmail()));
                                })
                                .toList();

                List<Model> modelDtos = models.stream()
                                .sorted(Comparator.comparing(ProjectModel::getUploadedAt,
                                                Comparator.nullsLast(Comparator.reverseOrder())))
                                .map(model -> new Model(
                                                model.getId(),
                                                model.getFileName(),
                                                "ifc",
                                                model.getFileUrl(),
                                                model.getUploadedAt(),
                                                model.getUploadedBy() == null ? null
                                                                : displayName(model.getUploadedBy()),
                                                toPaymentItemDtos(paymentItemsByModel.getOrDefault(model.getId(),
                                                                List.of()))))
                                .toList();

                List<ProjectResponses.PendingInvite> pendingInviteDtos = pendingInvites.stream()
                                .map(invite -> new ProjectResponses.PendingInvite(
                                                invite.getId(),
                                                invite.getEmail(),
                                                invite.getRole(),
                                                displayName(invite.getInvitedBy()),
                                                invite.getStatus(),
                                                invite.getCreatedAt()))
                                .toList();

                return new ProjectDetails(
                                project.getId(),
                                project.getName(),
                                project.getDescription(),
                                project.getLocation(),
                                project.getStartDate(),
                                "Active",
                                memberDtos,
                                modelDtos,
                                pendingInviteDtos,
                                currentUserRole,
                                currentUserCompanyRole);
        }

        private List<PaymentItemResponse> toPaymentItemDtos(List<PaymentItem> items) {
                return items.stream()
                                .map(item -> new PaymentItemResponse(
                                                item.getId(),
                                                item.getCategory(),
                                                item.getModel() == null ? null : item.getModel().getId().toString(),
                                                item.getModel() == null ? null : item.getModel().getFileName(),
                                                item.getContractor() == null ? null
                                                                : item.getContractor().getId().toString(),
                                                item.getContractor() == null ? null : displayName(item.getContractor()),
                                                item.getApprover() == null ? null
                                                                : item.getApprover().getId().toString(),
                                                item.getApprover() == null ? null : displayName(item.getApprover()),
                                                item.getContractValue(),
                                                item.getDescription(),
                                                item.getCreatedAt(),
                                                item.getUpdatedAt(),
                                                toClaimDtos(item.getClaims()),
                                                parseAttachedElementIds(item.getAttachedElementIdsJson()),
                                                item.getJobStatus(),
                                                item.getPaymentStatus(),
                                                item.isPaymentConfirmationPending(),
                                                toAuditEntryDtos(item.getAuditTrail())))
                                .toList();
        }

        private List<Claim> toClaimDtos(Collection<PaymentItemClaim> claims) {
                return claims == null ? List.of()
                                : claims.stream()
                                                .sorted(Comparator.comparing(PaymentItemClaim::getSequence))
                                                .map(claim -> new Claim(
                                                                claim.getId(),
                                                                claim.getSequence(),
                                                                claim.getAmount(),
                                                                claim.getDescription(),
                                                                claim.getStatus(),
                                                                claim.getSubmittedBy(),
                                                                claim.getSubmittedById(),
                                                                claim.getSubmittedAt(),
                                                                claim.getDecidedBy(),
                                                                claim.getDecidedById(),
                                                                claim.getDecidedAt(),
                                                                claim.getDecisionNote(),
                                                                claim.getPaidAt()))
                                                .toList();
        }

        private List<AuditEntry> toAuditEntryDtos(Collection<PaymentItemAuditEntry> auditTrail) {
                return auditTrail == null ? List.of()
                                : auditTrail.stream()
                                                .sorted(Comparator.comparing(PaymentItemAuditEntry::getTimestamp))
                                                .map(entry -> new AuditEntry(
                                                                entry.getId(),
                                                                entry.getTimestamp(),
                                                                entry.getActorId(),
                                                                entry.getActorName(),
                                                                entry.getActorRole(),
                                                                entry.getAction(),
                                                                entry.getField(),
                                                                entry.getFromValue(),
                                                                entry.getToValue()))
                                                .toList();
        }

        private List<String> parseAttachedElementIds(String raw) {
                if (raw == null || raw.isBlank()) {
                        return List.of();
                }
                String trimmed = raw.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                        String body = trimmed.substring(1, trimmed.length() - 1).trim();
                        if (body.isEmpty()) {
                                return List.of();
                        }
                        String[] parts = body.split(",");
                        return Arrays.stream(parts)
                                        .map(String::trim)
                                        .map(value -> value.replaceAll("^\"|\"$", ""))
                                        .filter(value -> !value.isBlank())
                                        .toList();
                }
                return Arrays.stream(trimmed.split(","))
                                .map(String::trim)
                                .filter(value -> !value.isBlank())
                                .toList();
        }

        private String displayName(User user) {
                String firstName = user.getFirstName();
                String lastName = user.getLastName();
                if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
                        return firstName + " " + lastName;
                }
                if (firstName != null && !firstName.isBlank()) {
                        return firstName;
                }
                if (lastName != null && !lastName.isBlank()) {
                        return lastName;
                }
                return user.getEmail();
        }

        private int avatarHue(String email) {
                if (email == null || email.isBlank()) {
                        return 250;
                }
                return Math.floorMod(email.toLowerCase().hashCode(), 360);
        }
}
