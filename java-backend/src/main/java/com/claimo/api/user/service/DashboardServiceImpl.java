package com.claimo.api.user.service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Jwt jwt) {
        User user = getAuthenticatedUser(jwt);
        CompanyContext currentCompany = resolveCompanyContext(user);
        UUID companyId = currentCompany.company().getId();

        List<Project> projects = projectRepository.findAllByCompanyId(companyId);
        projects.sort(Comparator.comparing(Project::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

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
                        toModelSummaries(modelsByProject.getOrDefault(project.getId(), List.of()), paymentItemsByModel)))
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

    private CompanyContext resolveCompanyContext(User user) {
        Company ownedCompany = companyRepository.findByOwner_Id(user.getId()).orElse(null);
        if (ownedCompany != null) {
            return new CompanyContext(ownedCompany, CompanyRole.ACCOUNT_OWNER);
        }

        List<CompanyMember> memberships = companyMemberService.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new AppExceptions.ResourceNotFoundException(
                    "Company not found for userId: " + user.getId());
        }

        CompanyMember membership = memberships.get(0);
        return new CompanyContext(membership.getCompany(), membership.getRole());
    }

    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

    private Map<UUID, List<ProjectMember>> loadMembersByProject(List<Project> projects) {
        if (projects.isEmpty()) {
            return Map.of();
        }

        return projectMemberRepository.findAllByProject_Company_Id(projects.get(0).getCompany().getId()).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        member -> member.getProject().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
    }

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

    private List<DashboardResponse.MemberSummary> toMemberSummaries(List<ProjectMember> members) {
        return members.stream()
                .map(member -> {
                    User memberUser = member.getUser();
                    return new DashboardResponse.MemberSummary(
                            memberUser.getId(),
                            displayName(memberUser),
                            memberUser.getEmail(),
                            member.getRole().name(),
                            member.getCreatedAt() == null ? null
                                    : DASHBOARD_DATE.format(member.getCreatedAt().atOffset(java.time.ZoneOffset.UTC)),
                            avatarHue(memberUser.getEmail()));
                })
                .toList();
    }

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
                        model.getUploadedBy() == null ? null : displayName(model.getUploadedBy()),
                        toPaymentItemSummaries(paymentItemsByModel.getOrDefault(model.getId(), List.of()))))
                .toList();
    }

    private List<DashboardResponse.PaymentItemSummary> toPaymentItemSummaries(List<PaymentItem> items) {
        return items.stream()
                .map(item -> new DashboardResponse.PaymentItemSummary(
                        item.getId(),
                        item.getCategory(),
                        item.getModel() == null ? null : item.getModel().getId().toString(),
                        item.getModel() == null ? null : item.getModel().getFileName(),
                        item.getContractor() == null ? null : item.getContractor().getId().toString(),
                        item.getContractor() == null ? null : displayName(item.getContractor()),
                        item.getApprover() == null ? null : item.getApprover().getId().toString(),
                        item.getApprover() == null ? null : displayName(item.getApprover()),
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

    private List<DashboardResponse.ClaimSummary> toClaimSummaries(java.util.Collection<PaymentItemClaim> claims) {
        return claims == null ? List.of() : claims.stream()
                        .map(claim -> new DashboardResponse.ClaimSummary(
                                claim.getId(),
                                claim.getSequence(),
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

    private List<DashboardResponse.AuditEntrySummary> toAuditEntrySummaries(java.util.Collection<PaymentItemAuditEntry> auditTrail) {
        return auditTrail == null ? List.of() : auditTrail.stream()
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

    private List<String> parseAttachedElementIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            String body = trimmed.substring(1, trimmed.length() - 1).trim();
            if (body.isEmpty())
                return List.of();
            String[] parts = body.split(",");
            return java.util.Arrays.stream(parts)
                    .map(String::trim)
                    .map(s -> s.replaceAll("^\"|\"$", ""))
                    .filter(s -> !s.isBlank())
                    .toList();
        }
        return java.util.Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
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

    private record CompanyContext(Company company, CompanyRole role) {
    }
}
