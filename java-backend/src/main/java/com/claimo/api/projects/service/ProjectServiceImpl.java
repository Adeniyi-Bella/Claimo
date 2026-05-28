package com.claimo.api.projects.service;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.invites.CompanyInviteService;
import com.claimo.api.company.membership.CompanyMember;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.requests.ProjectRequests;
import com.claimo.api.projects.dto.response.CreateUpdateProjectResponse;
import com.claimo.api.projects.dto.response.DashboardResponse;
import com.claimo.api.projects.dto.response.ProjectResponses;
import com.claimo.api.projects.dto.AuditEntryDto;
import com.claimo.api.projects.dto.ClaimDto;
import com.claimo.api.projects.dto.MemberDto;
import com.claimo.api.projects.dto.ModelDto;
import com.claimo.api.projects.dto.PaymentItemResponseDto;
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

import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.util.*;
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
        private final CompanyInviteService companyInviteService;

        // -------------------------------------------------------------------------
        // Public API
        // -------------------------------------------------------------------------

        @Override
        @Transactional
        public CreateUpdateProjectResponse createProject(Jwt jwt, ProjectRequests.CreateProject request) {
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
        @Transactional(readOnly = true)
        public List<ProjectDetails> getProjects(Jwt jwt) {
                User user = getAuthenticatedUser(jwt);

                Set<UUID> elevatedCompanyIds = companyMemberService.findByUserId(user.getId()).stream()
                                .filter(m -> m.getRole() == CompanyRole.ACCOUNT_OWNER
                                                || m.getRole() == CompanyRole.ADMIN)
                                .map(m -> m.getCompany().getId())
                                .collect(Collectors.toSet());

                LinkedHashMap<UUID, Project> visibleProjects = new LinkedHashMap<>();

                if (!elevatedCompanyIds.isEmpty()) {
                        projectRepository.findAllByCompanyIdIn(List.copyOf(elevatedCompanyIds))
                                        .forEach(p -> visibleProjects.putIfAbsent(p.getId(), p));
                }

                projectMemberRepository.findAllByUserId(user.getId()).stream()
                                .map(ProjectMember::getProject)
                                .forEach(p -> visibleProjects.putIfAbsent(p.getId(), p));

                if (visibleProjects.isEmpty()) {
                        return List.of();
                }

                List<UUID> projectIds = new ArrayList<>(visibleProjects.keySet());
                Map<UUID, List<ProjectMember>> membersByProject = loadMembersByProjectIds(projectIds);
                Map<UUID, List<ProjectModel>> modelsByProject = loadModelsByProjectIds(projectIds);
                Map<UUID, List<PaymentItem>> paymentItemsByModel = loadPaymentItemsByModelFromProjectIds(projectIds);

                return visibleProjects.values().stream()
                                .sorted(Comparator.comparing(Project::getCreatedAt,
                                                Comparator.nullsLast(Comparator.reverseOrder())))
                                .map(project -> toDetails(
                                                project,
                                                membersByProject.getOrDefault(project.getId(), List.of()),
                                                modelsByProject.getOrDefault(project.getId(), List.of()),
                                                paymentItemsByModel,
                                                List.of(), // no pending invites on list view
                                                null,
                                                null))
                                .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public ProjectDetails getProjectById(Jwt jwt, UUID projectId) {
                User user = getAuthenticatedUser(jwt);
                Project project = getProjectForView(projectId, user);
                List<ProjectMember> members = projectMemberRepository.findAllByProjectId(projectId);

                ProjectRole currentUserRole = members.stream()
                                .filter(m -> m.getUser().getId().equals(user.getId()))
                                .map(ProjectMember::getRole)
                                .findFirst()
                                .orElse(null);

                CompanyRole currentUserCompanyRole = companyMemberService.findByUserId(user.getId()).stream()
                                .filter(m -> m.getCompany().getId().equals(project.getCompany().getId()))
                                .map(CompanyMember::getRole)
                                .findFirst()
                                .orElse(null);

                Map<UUID, List<PaymentItem>> paymentItemsByModel = loadPaymentItemsByModelFromProjectIds(
                                List.of(projectId));

                return toDetails(
                                project,
                                members,
                                projectModelRepository.findAllByProject_IdIn(List.of(projectId)),
                                paymentItemsByModel,
                                pendingInviteRepository.findAllByProjectIdAndStatus(projectId,
                                                PendingInviteStatus.PENDING),
                                currentUserRole,
                                currentUserCompanyRole);
        }

        @Override
        @Transactional
        public CreateUpdateProjectResponse updateProject(Jwt jwt, UUID projectId,
                        ProjectRequests.UpdateProject request) {
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
         * Builds the dashboard response for the authenticated user.
         * Reuses the same batch-loading and mapping infrastructure as getProjects.
         *
         * Company resolution priority:
         * 1. Owned company (ACCOUNT_OWNER)
         * 2. First company membership
         *
         * Project visibility mirrors getProjects:
         * - Company admins see all projects in their admin companies
         * - Others see only projects they are explicitly a member of
         */
        @Override
        @Transactional(readOnly = true)
        public DashboardResponse getDashboardData(Jwt jwt) {
                User user = getAuthenticatedUser(jwt);

                companyInviteService.markUserCreatedInvitesAccepted(user.getEmail(), user);

                CompanyContext companyCtx = resolveCompanyContext(user);

                // Collect all company IDs the user is associated with
                List<UUID> allCompanyIds = new ArrayList<>();
                allCompanyIds.add(companyCtx.company().getId());
                companyMemberService.findByUserId(user.getId()).stream()
                                .map(m -> m.getCompany().getId())
                                .filter(id -> !allCompanyIds.contains(id))
                                .forEach(allCompanyIds::add);

                List<Project> projects = projectRepository.findAllByCompanyIdIn(allCompanyIds);

                // Non-admins are restricted to projects they are explicitly a member of
                Set<UUID> adminCompanyIds = getAdminCompanyIds(user);
                if (!adminCompanyIds.containsAll(allCompanyIds)) {
                        Set<UUID> userProjectIds = projectMemberRepository.findAllByUser_Id(user.getId()).stream()
                                        .map(pm -> pm.getProject().getId())
                                        .collect(Collectors.toSet());
                        projects = projects.stream()
                                        .filter(p -> adminCompanyIds.contains(p.getCompany().getId())
                                                        || userProjectIds.contains(p.getId()))
                                        .toList();
                }

                projects = projects.stream()
                                .sorted(Comparator.comparing(Project::getCreatedAt,
                                                Comparator.nullsLast(Comparator.reverseOrder())))
                                .toList();

                List<UUID> projectIds = projects.stream().map(Project::getId).toList();
                Map<UUID, List<ProjectMember>> membersByProject = projectIds.isEmpty() ? Map.of()
                                : loadMembersByProjectIds(projectIds);
                Map<UUID, List<ProjectModel>> modelsByProject = projectIds.isEmpty() ? Map.of()
                                : loadModelsByProjectIds(projectIds);
                Map<UUID, List<PaymentItem>> paymentItemsByModel = projectIds.isEmpty() ? Map.of()
                                : loadPaymentItemsByModelFromProjectIds(projectIds);

                List<DashboardResponse.ProjectSummary> projectSummaries = projects.stream()
                                .map(project -> toDashboardProjectSummary(
                                                project,
                                                membersByProject.getOrDefault(project.getId(), List.of()),
                                                modelsByProject.getOrDefault(project.getId(), List.of()),
                                                paymentItemsByModel))
                                .toList();

                return new DashboardResponse(
                                new DashboardResponse.UserSummary(
                                                user.getId(),
                                                displayName(user),
                                                user.getEmail(),
                                                avatarHue(user.getEmail())),
                                new DashboardResponse.CompanySummary(
                                                CompanyDto.fromEntity(companyCtx.company()),
                                                companyCtx.role()),
                                projectSummaries);
        }

        // -------------------------------------------------------------------------
        // Batch data loaders — shared by getProjects, getProjectById, getDashboardData
        // -------------------------------------------------------------------------

        private Map<UUID, List<ProjectMember>> loadMembersByProjectIds(List<UUID> projectIds) {
                return projectMemberRepository.findAllByProject_IdIn(projectIds).stream()
                                .collect(Collectors.groupingBy(
                                                m -> m.getProject().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));
        }

        private Map<UUID, List<ProjectModel>> loadModelsByProjectIds(List<UUID> projectIds) {
                return projectModelRepository.findAllByProject_IdIn(projectIds).stream()
                                .collect(Collectors.groupingBy(
                                                m -> m.getProject().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));
        }

        /**
         * Returns payment items keyed by model ID (not project ID),
         * because both toDetails and toDashboardProjectSummary render items under
         * their parent model.
         */
        private Map<UUID, List<PaymentItem>> loadPaymentItemsByModelFromProjectIds(List<UUID> projectIds) {
                return paymentItemRepository.findAllByProject_IdIn(projectIds).stream()
                                .collect(Collectors.groupingBy(
                                                item -> item.getModel().getId(),
                                                LinkedHashMap::new,
                                                Collectors.toList()));
        }

        // -------------------------------------------------------------------------
        // ProjectResponses mappers (used by getProjects / getProjectById)
        // -------------------------------------------------------------------------

        private ProjectDetails toDetails(
                        Project project,
                        List<ProjectMember> members,
                        List<ProjectModel> models,
                        Map<UUID, List<PaymentItem>> paymentItemsByModel,
                        List<com.claimo.api.projects.models.PendingInvite> pendingInvites,
                        ProjectRole currentUserRole,
                        CompanyRole currentUserCompanyRole) {

                List<MemberDto> memberDtos = members.stream()
                                .map(m -> {
                                        User u = m.getUser();
                                        return new MemberDto(
                                                        u.getId(),
                                                        displayName(u),
                                                        u.getEmail(),
                                                        m.getRole(),
                                                        m.getCreatedAt() == null ? null
                                                                        : m.getCreatedAt().atOffset(ZoneOffset.UTC)
                                                                                        .toString(),
                                                        avatarHue(u.getEmail()));
                                })
                                .toList();

                List<ModelDto> modelDtos = models.stream()
                                .sorted(Comparator.comparing(ProjectModel::getUploadedAt,
                                                Comparator.nullsLast(Comparator.reverseOrder())))
                                .map(model -> new ModelDto(
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

        private List<PaymentItemResponseDto> toPaymentItemDtos(List<PaymentItem> items) {
                return items.stream()
                                .map(item -> new PaymentItemResponseDto(
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

        private List<ClaimDto> toClaimDtos(Collection<PaymentItemClaim> claims) {
                return claims == null ? List.of()
                                : claims.stream()
                                                .sorted(Comparator.comparing(PaymentItemClaim::getSequence))
                                                .map(c -> new ClaimDto(
                                                                c.getId(), c.getSequence(), c.getAmount(),
                                                                c.getDescription(),
                                                                c.getStatus(), c.getSubmittedBy(), c.getSubmittedById(),
                                                                c.getSubmittedAt(), c.getDecidedBy(),
                                                                c.getDecidedById(),
                                                                c.getDecidedAt(), c.getDecisionNote(), c.getPaidAt()))
                                                .toList();
        }

        private List<AuditEntryDto> toAuditEntryDtos(Collection<PaymentItemAuditEntry> auditTrail) {
                return auditTrail == null ? List.of()
                                : auditTrail.stream()
                                                .sorted(Comparator.comparing(PaymentItemAuditEntry::getTimestamp))
                                                .map(e -> new AuditEntryDto(
                                                                e.getId(), e.getTimestamp(), e.getActorId(),
                                                                e.getActorName(),
                                                                e.getActorRole(), e.getAction(), e.getField(),
                                                                e.getFromValue(), e.getToValue()))
                                                .toList();
        }

        // -------------------------------------------------------------------------
        // DashboardResponse mappers (used by getDashboardData)
        //
        // Kept separate from ProjectResponses mappers because the record types differ:
        // DashboardResponse uses double + String for enums;
        // ProjectResponses uses BigDecimal + typed enums.
        // -------------------------------------------------------------------------

        private DashboardResponse.ProjectSummary toDashboardProjectSummary(
                        Project project,
                        List<ProjectMember> members,
                        List<ProjectModel> models,
                        Map<UUID, List<PaymentItem>> paymentItemsByModel) {

                return new DashboardResponse.ProjectSummary(
                                project.getId(),
                                project.getName(),
                                project.getDescription(),
                                project.getLocation(),
                                project.getStartDate(),
                                "Active",
                                toDashboardMemberSummaries(members),
                                toDashboardModelSummaries(models, paymentItemsByModel));
        }

        private List<MemberDto> toDashboardMemberSummaries(List<ProjectMember> members) {
                return members.stream()
                                .map(m -> {
                                        User u = m.getUser();
                                        return new MemberDto(
                                                        u.getId(),
                                                        displayName(u),
                                                        u.getEmail(),
                                                        m.getRole(),
                                                        m.getCreatedAt() == null ? null
                                                                        : m.getCreatedAt().atOffset(ZoneOffset.UTC)
                                                                                        .toLocalDate().toString(),
                                                        avatarHue(u.getEmail()));
                                })
                                .toList();
        }

        private List<ModelDto> toDashboardModelSummaries(
                        List<ProjectModel> models,
                        Map<UUID, List<PaymentItem>> paymentItemsByModel) {
                return models.stream()
                                .map(model -> new ModelDto(
                                                model.getId(),
                                                model.getFileName(),
                                                "ifc",
                                                model.getFileUrl(),
                                                model.getUploadedAt(),
                                                model.getUploadedBy() == null ? null
                                                                : displayName(model.getUploadedBy()),
                                                toDashboardPaymentItemSummaries(
                                                                paymentItemsByModel.getOrDefault(model.getId(),
                                                                                List.of()))))
                                .toList();
        }

        private List<PaymentItemResponseDto> toDashboardPaymentItemSummaries(List<PaymentItem> items) {
                return items.stream()
                                .map(item -> new PaymentItemResponseDto(
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
                                                item.getContractValue() == null ? BigDecimal.ZERO
                                                                : item.getContractValue(),
                                                item.getDescription(),
                                                item.getCreatedAt(),
                                                item.getUpdatedAt(),
                                                toDashboardClaimSummaries(item.getClaims()),
                                                parseAttachedElementIds(item.getAttachedElementIdsJson()),
                                                item.getJobStatus(),
                                                item.getPaymentStatus(),
                                                item.isPaymentConfirmationPending(),
                                                toDashboardAuditEntrySummaries(item.getAuditTrail())))
                                .toList();
        }

        private List<ClaimDto> toDashboardClaimSummaries(
                        Collection<PaymentItemClaim> claims) {
                return claims == null ? List.of()
                                : claims.stream()
                                                .sorted(Comparator.comparing(PaymentItemClaim::getSequence))
                                                .map(c -> new ClaimDto(
                                                                c.getId(), c.getSequence(),
                                                                c.getAmount() == null ? BigDecimal.ZERO : c.getAmount(),
                                                                c.getDescription(), c.getStatus(),
                                                                c.getSubmittedBy(), c.getSubmittedById(),
                                                                c.getSubmittedAt(),
                                                                c.getDecidedBy(), c.getDecidedById(), c.getDecidedAt(),
                                                                c.getDecisionNote(), c.getPaidAt()))
                                                .toList();
        }

        private List<AuditEntryDto> toDashboardAuditEntrySummaries(
                        Collection<PaymentItemAuditEntry> auditTrail) {
                return auditTrail == null ? List.of()
                                : auditTrail.stream()
                                                .sorted(Comparator.comparing(PaymentItemAuditEntry::getTimestamp))
                                                .map(e -> new AuditEntryDto(
                                                                e.getId(), e.getTimestamp(), e.getActorId(),
                                                                e.getActorName(),
                                                                e.getActorRole(), e.getAction(),
                                                                e.getField(),
                                                                e.getFromValue(), e.getToValue()))
                                                .toList();
        }

        // -------------------------------------------------------------------------
        // Company resolution (moved from DashboardServiceImpl)
        // -------------------------------------------------------------------------

        /**
         * Owned company takes priority; falls back to first membership.
         * Throws ResourceNotFoundException if no company association exists.
         */
        private CompanyContext resolveCompanyContext(User user) {
                Company owned = companyRepository.findByOwner_Id(user.getId()).orElse(null);
                if (owned != null) {
                        return new CompanyContext(owned, CompanyRole.ACCOUNT_OWNER);
                }
                List<CompanyMember> memberships = companyMemberService.findByUserId(user.getId());
                if (memberships.isEmpty()) {
                        throw new AppExceptions.ResourceNotFoundException(
                                        "Company not found for userId: " + user.getId());
                }
                CompanyMember m = memberships.get(0);
                return new CompanyContext(m.getCompany(), m.getRole());
        }

        private Set<UUID> getAdminCompanyIds(User user) {
                Set<UUID> ids = new HashSet<>();
                companyRepository.findByOwner_Id(user.getId()).ifPresent(c -> ids.add(c.getId()));
                companyMemberService.findByUserId(user.getId()).stream()
                                .filter(m -> m.getRole() == CompanyRole.ACCOUNT_OWNER
                                                || m.getRole() == CompanyRole.ADMIN)
                                .map(m -> m.getCompany().getId())
                                .forEach(ids::add);
                return ids;
        }

        private record CompanyContext(Company company, CompanyRole role) {
        }

        // -------------------------------------------------------------------------
        // Guards and lookups
        // -------------------------------------------------------------------------

        private User getAuthenticatedUser(Jwt jwt) {
                return userService.findByClerkUserId(jwt.getSubject())
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "User not found for clerkUserId: " + jwt.getSubject()));
        }

        private Project getProjectForView(UUID projectId, User user) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Project not found: " + projectId));
                if (projectMemberService.isMember(projectId, user.getId())
                                || canViewAllProjectsInCompany(project.getCompany().getId(), user.getId())) {
                        return project;
                }
                throw new AppExceptions.ForbiddenException("Access denied to project: " + projectId);
        }

        private Project getProjectForProjectAdmin(UUID projectId, User user) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Project not found: " + projectId));
                if (!projectMemberService.isMember(projectId, user.getId())) {
                        throw new AppExceptions.ForbiddenException("Access denied to project: " + projectId);
                }
                if (projectMemberService.getRole(projectId, user.getId()) != ProjectRole.ADMIN) {
                        throw new AppExceptions.ForbiddenException("Only project ADMINs can manage projects");
                }
                return project;
        }

        private boolean canViewAllProjectsInCompany(UUID companyId, UUID userId) {
                return companyMemberService.findByUserId(userId).stream()
                                .filter(m -> m.getCompany().getId().equals(companyId))
                                .anyMatch(m -> m.getRole() == CompanyRole.ACCOUNT_OWNER
                                                || m.getRole() == CompanyRole.ADMIN);
        }

        private Company getOwnedCompany(User user) {
                return companyRepository.findByOwner_Id(user.getId())
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Company not found for owner userId: " + user.getId()));
        }

        private CreateUpdateProjectResponse toResponse(Project project, User user) {
                ProjectRole role = projectMemberService.isMember(project.getId(), user.getId())
                                ? projectMemberService.getRole(project.getId(), user.getId())
                                : null;
                return new CreateUpdateProjectResponse(
                                project.getId(), project.getName(), project.getDescription(),
                                project.getLocation(), project.getStartDate(),
                                project.getCompany().getId(), project.getCreatedBy().getId(),
                                role, project.getCreatedAt(), project.getUpdatedAt());
        }

        // -------------------------------------------------------------------------
        // Shared utilities
        // -------------------------------------------------------------------------

        private List<String> parseAttachedElementIds(String raw) {
                if (raw == null || raw.isBlank())
                        return List.of();
                String trimmed = raw.trim();
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                        String body = trimmed.substring(1, trimmed.length() - 1).trim();
                        if (body.isEmpty())
                                return List.of();
                        return Arrays.stream(body.split(","))
                                        .map(String::trim)
                                        .map(s -> s.replaceAll("^\"|\"$", ""))
                                        .filter(s -> !s.isBlank())
                                        .toList();
                }
                return Arrays.stream(trimmed.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isBlank())
                                .toList();
        }

        private String displayName(User user) {
                String f = user.getFirstName(), l = user.getLastName();
                if (f != null && !f.isBlank() && l != null && !l.isBlank())
                        return f + " " + l;
                if (f != null && !f.isBlank())
                        return f;
                if (l != null && !l.isBlank())
                        return l;
                return user.getEmail();
        }

        private int avatarHue(String email) {
                if (email == null || email.isBlank())
                        return 250;
                return Math.floorMod(email.toLowerCase().hashCode(), 360);
        }
}