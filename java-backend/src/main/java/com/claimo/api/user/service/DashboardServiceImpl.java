package com.claimo.api.user.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.membership.CompanyMember;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.company.model.Company;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.models.PaymentItem;
import com.claimo.api.projects.models.PaymentItemAuditEntry;
import com.claimo.api.projects.models.PaymentItemClaim;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.models.ProjectModel;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.projects.repository.PaymentItemRepository;
import com.claimo.api.projects.repository.ProjectModelRepository;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.dto.DashboardResponse;
import com.claimo.api.user.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final DateTimeFormatter DASHBOARD_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final UserService userService;
    private final CompanyRepository companyRepository;
    private final CompanyMemberService companyMemberService;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectModelRepository projectModelRepository;
    private final PaymentItemRepository paymentItemRepository;

    /**
     * Builds the full dashboard response for the authenticated user.
     *
     * it resolves a single company context for the user
     * and returns everything scoped to that company.
     *
     * Data is batched to avoid N+1 queries:
     * - Members are fetched once per company
     * - Models and payment items are fetched with IN-clause queries across all
     * project IDs
     *
     * @param jwt the JWT token of the authenticated user
     * @return a fully populated DashboardResponse
     */
    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Jwt jwt) {

        User user = getAuthenticatedUser(jwt);

        CompanyContext currentCompany = resolveCompanyContext(user);

        // Collect all company IDs the user is associated with
        List<UUID> allCompanyIds = new ArrayList<>();
        allCompanyIds.add(currentCompany.company().getId());

        // Add any additional company memberships
        companyMemberService.findByUserId(user.getId()).stream()
                .map(m -> m.getCompany().getId())
                .filter(id -> !allCompanyIds.contains(id))
                .forEach(allCompanyIds::add);

        // Fetch projects across all companies
        List<Project> projects = projectRepository.findAllByCompanyIdIn(allCompanyIds);

        // If not an admin in ALL companies, filter down to only assigned projects
        Set<UUID> adminCompanyIds = getAdminCompanyIds(user);
        if (!adminCompanyIds.containsAll(allCompanyIds)) {
            Set<UUID> userProjectIds = projectMemberRepository.findAllByUser_Id(user.getId())
                    .stream()
                    .map(pm -> pm.getProject().getId())
                    .collect(java.util.stream.Collectors.toSet());

            projects = projects.stream()
                    .filter(p -> adminCompanyIds.contains(p.getCompany().getId())
                            || userProjectIds.contains(p.getId()))
                    .toList();
        }

        projects = projects.stream()
                .sorted(Comparator.comparing(Project::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        Map<UUID, List<ProjectMember>> membersByProject = loadMembersByProject(projects);
        Map<UUID, List<ProjectModel>> modelsByProject = loadModelsByProject(projects);
        Map<UUID, List<PaymentItem>> paymentItemsByModel = loadPaymentItemsByModel(projects);

        List<DashboardResponse.ProjectSummary> projectSummaries = projects.stream()
                .map(project -> new DashboardResponse.ProjectSummary(
                        project.getId(),
                        project.getName(),
                        project.getDescription(),
                        project.getLocation(),
                        project.getStartDate(),
                        "Active",
                        toMemberSummaries(membersByProject.getOrDefault(project.getId(), List.of())),
                        toModelSummaries(modelsByProject.getOrDefault(project.getId(), List.of()),
                                paymentItemsByModel)))
                .toList();

        return new DashboardResponse(
                new DashboardResponse.UserSummary(
                        user.getId(),
                        displayName(user),
                        user.getEmail(),
                        avatarHue(user.getEmail())),
                new DashboardResponse.CompanySummary(
                        CompanyDto.fromEntity(currentCompany.company()),
                        currentCompany.role()),
                projectSummaries);
    }

    private Set<UUID> getAdminCompanyIds(User user) {
        Set<UUID> adminIds = new HashSet<>();

        // Owned company — always admin
        companyRepository.findByOwner_Id(user.getId())
                .ifPresent(c -> adminIds.add(c.getId()));

        // Company memberships with admin role
        companyMemberService.findByUserId(user.getId()).stream()
                .filter(m -> isCompanyAdmin(m.getRole()))
                .map(m -> m.getCompany().getId())
                .forEach(adminIds::add);

        return adminIds;
    }

    private boolean isCompanyAdmin(CompanyRole role) {
    return role == CompanyRole.ACCOUNT_OWNER || role == CompanyRole.ADMIN;
}

    /**
     * Resolves the company context for the given user.
     *
     * Priority:
     * 1. If the user owns a company, they are treated as ACCOUNT_OWNER of that
     * company
     * 2. Otherwise, the first company membership is used
     *
     * Throws ResourceNotFoundException if no company association exists.
     */
    private CompanyContext resolveCompanyContext(User user) {
        // Check if the user owns a company — ownership takes priority over membership
        Company ownedCompany = companyRepository.findByOwner_Id(user.getId()).orElse(null);
        if (ownedCompany != null) {
            return new CompanyContext(ownedCompany, CompanyRole.ACCOUNT_OWNER);
        }

        // Fall back to the first company membership if no owned company found
        List<CompanyMember> memberships = companyMemberService.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new AppExceptions.ResourceNotFoundException(
                    "Company not found for userId: " + user.getId());
        }

        CompanyMember membership = memberships.get(0);
        return new CompanyContext(membership.getCompany(), membership.getRole());
    }

    /**
     * Resolves the authenticated user from the JWT subject claim (Clerk user ID).
     *
     * Throws ResourceNotFoundException if the user does not exist in the database.
     */
    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

    /**
     * Batch fetches all project members for the company in a single query,
     * then groups them by project ID.
     *
     * Uses the company ID from the first project rather than individual project IDs
     * to avoid a large IN clause when the company has many projects.
     */
    private Map<UUID, List<ProjectMember>> loadMembersByProject(List<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }

        // Fetch all members for the company in one query, grouped by project
        return projectMemberRepository.findAllByProject_Company_Id(projects.get(0).getCompany().getId()).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        member -> member.getProject().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
    }

    /**
     * Batch fetches all models for the given projects using a single IN-clause
     * query,
     * then groups them by project ID.
     */
    private Map<UUID, List<ProjectModel>> loadModelsByProject(List<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }

        List<UUID> projectIds = projects.stream().map(Project::getId).toList();
        return projectModelRepository.findAllByProject_IdIn(projectIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        model -> model.getProject().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
    }

    /**
     * Batch fetches all payment items for the given projects using a single
     * IN-clause query,
     * then groups them by model ID.
     *
     * Note: keyed by model ID (not project ID) because payment items are
     * rendered under their parent model in the dashboard UI.
     */
    private Map<UUID, List<PaymentItem>> loadPaymentItemsByModel(List<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }

        List<UUID> projectIds = projects.stream().map(Project::getId).toList();
        return paymentItemRepository.findAllByProject_IdIn(projectIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        item -> item.getModel().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
    }

    /**
     * Maps a list of ProjectMembers to MemberSummary DTOs.
     * Formats the join date as ISO local date (yyyy-MM-dd).
     * Generates a deterministic avatar hue from the member's email.
     */
    private List<DashboardResponse.MemberSummary> toMemberSummaries(List<ProjectMember> members) {
        return members.stream()
                .map(member -> {
                    User memberUser = member.getUser();
                    return new DashboardResponse.MemberSummary(
                            memberUser.getId(),
                            displayName(memberUser),
                            memberUser.getEmail(),
                            member.getRole().name(),
                            // Format createdAt as a date string, null-safe
                            member.getCreatedAt() == null ? null
                                    : DASHBOARD_DATE.format(member.getCreatedAt().atOffset(java.time.ZoneOffset.UTC)),
                            avatarHue(memberUser.getEmail()));
                })
                .toList();
    }

    /**
     * Maps a list of ProjectModels to ModelSummary DTOs.
     * Injects pre-fetched payment items for each model to avoid additional queries.
     */
    private List<DashboardResponse.ModelSummary> toModelSummaries(
            List<ProjectModel> models,
            Map<UUID, List<PaymentItem>> paymentItemsByModel) {
        return models.stream()
                .map(model -> new DashboardResponse.ModelSummary(
                        model.getId(),
                        model.getFileName(),
                        "ifc",
                        model.getFileUrl(),
                        model.getUploadedAt(),
                        // Null-safe display name for the uploader
                        model.getUploadedBy() == null ? null : displayName(model.getUploadedBy()),
                        // Look up pre-fetched payment items for this model
                        toPaymentItemSummaries(paymentItemsByModel.getOrDefault(model.getId(), List.of()))))
                .toList();
    }

    /**
     * Maps a list of PaymentItems to PaymentItemSummary DTOs.
     * All nested collections (claims, audit trail) are also mapped inline.
     * All user references are null-safe.
     */
    private List<DashboardResponse.PaymentItemSummary> toPaymentItemSummaries(List<PaymentItem> items) {
        return items.stream()
                .map(item -> new DashboardResponse.PaymentItemSummary(
                        item.getId(),
                        item.getCategory(),
                        // Null-safe model reference
                        item.getModel() == null ? null : item.getModel().getId().toString(),
                        item.getModel() == null ? null : item.getModel().getFileName(),
                        // Null-safe contractor reference
                        item.getContractor() == null ? null : item.getContractor().getId().toString(),
                        item.getContractor() == null ? null : displayName(item.getContractor()),
                        // Null-safe approver reference
                        item.getApprover() == null ? null : item.getApprover().getId().toString(),
                        item.getApprover() == null ? null : displayName(item.getApprover()),
                        // Default contract value to 0 if null
                        item.getContractValue() == null ? 0d : item.getContractValue().doubleValue(),
                        item.getDescription(),
                        item.getCreatedAt(),
                        item.getUpdatedAt(),
                        toClaimSummaries(item.getClaims()),
                        parseAttachedElementIds(item.getAttachedElementIdsJson()),
                        item.getJobStatus().name(),
                        item.getPaymentStatus().name(),
                        item.isPaymentConfirmationPending(),
                        toAuditEntrySummaries(item.getAuditTrail())))
                .toList();
    }

    /**
     * Maps payment item claims to ClaimSummary DTOs.
     * Returns an empty list if claims is null.
     */
    private List<DashboardResponse.ClaimSummary> toClaimSummaries(java.util.Collection<PaymentItemClaim> claims) {
        return claims == null ? List.of()
                : claims.stream()
                        .map(claim -> new DashboardResponse.ClaimSummary(
                                claim.getId(),
                                claim.getSequence(),
                                // Default claim amount to 0 if null
                                claim.getAmount() == null ? 0d : claim.getAmount().doubleValue(),
                                claim.getDescription(),
                                claim.getStatus().name(),
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

    /**
     * Maps audit trail entries to AuditEntrySummary DTOs.
     * Returns an empty list if auditTrail is null.
     */
    private List<DashboardResponse.AuditEntrySummary> toAuditEntrySummaries(
            java.util.Collection<PaymentItemAuditEntry> auditTrail) {
        return auditTrail == null ? List.of()
                : auditTrail.stream()
                        .map(entry -> new DashboardResponse.AuditEntrySummary(
                                entry.getId(),
                                entry.getTimestamp(),
                                entry.getActorId(),
                                entry.getActorName(),
                                entry.getActorRole().name(),
                                entry.getAction(),
                                entry.getField().name(),
                                entry.getFromValue(),
                                entry.getToValue()))
                        .toList();
    }

    /**
     * Parses a JSON array string of element IDs into a plain List of strings.
     *
     * Handles two formats:
     * - JSON array: ["id1","id2"] → [id1, id2]
     * - CSV: id1,id2 → [id1, id2]
     *
     * Returns an empty list for null or blank input.
     */
    private List<String> parseAttachedElementIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String trimmed = raw.trim();

        // Handle JSON array format
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            String body = trimmed.substring(1, trimmed.length() - 1).trim();
            if (body.isEmpty())
                return List.of();
            String[] parts = body.split(",");
            return java.util.Arrays.stream(parts)
                    .map(String::trim)
                    // Strip surrounding quotes from JSON string values
                    .map(s -> s.replaceAll("^\"|\"$", ""))
                    .filter(s -> !s.isBlank())
                    .toList();
        }

        // Fall back to CSV format
        return java.util.Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    /**
     * Builds a display name from first and last name, falling back to email.
     *
     * Priority: "First Last" → "First" → "Last" → email
     */
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
        // Last resort fallback
        return user.getEmail();
    }

    /**
     * Generates a deterministic HSL hue value (0–359) from the user's email.
     * Used to assign a consistent avatar background color per user.
     * Defaults to 250 (blue) for null or blank emails.
     */
    private int avatarHue(String email) {
        if (email == null || email.isBlank()) {
            return 250;
        }
        return Math.floorMod(email.toLowerCase().hashCode(), 360);
    }

    /**
     * Internal record holding a resolved company and the user's role within it.
     * Used to avoid passing company and role as separate parameters through the
     * call chain.
     */
    private record CompanyContext(Company company, CompanyRole role) {
    }
}