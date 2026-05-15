package com.claimo.api.company.membership;

import com.claimo.api.company.dto.response.CompanyMemberResponses;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.model.Company;
import com.claimo.api.company.CompanyRepository;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyMemberViewService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberService companyMemberService;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserService userService;

    public List<CompanyMemberResponses.CompanyMember> getCompanyMembers(Jwt jwt, UUID companyId) {
        User requester = getAuthenticatedUser(jwt);
        Company company = getCompanyForViewer(companyId, requester);

        List<CompanyMember> members = companyMemberService.findByCompanyId(company.getId());
        List<ProjectMember> projectMemberships = projectMemberRepository.findAllByProject_Company_Id(company.getId());

        return members.stream()
                .map(member -> toResponse(member, projectMemberships))
                .sorted(Comparator.comparing(CompanyMemberResponses.CompanyMember::email))
                .toList();
    }

    private CompanyMemberResponses.CompanyMember toResponse(CompanyMember member,
            List<ProjectMember> projectMemberships) {
        List<CompanyMemberResponses.ProjectMembership> projects = projectMemberships.stream()
                .filter(projectMember -> projectMember.getUser().getId().equals(member.getUser().getId()))
                .map(projectMember -> new CompanyMemberResponses.ProjectMembership(
                        projectMember.getProject().getId(),
                        projectMember.getProject().getName(),
                        projectMember.getRole(),
                        projectMember.getCreatedAt()))
                .sorted(Comparator.comparing(CompanyMemberResponses.ProjectMembership::projectName))
                .toList();

        return new CompanyMemberResponses.CompanyMember(
                member.getUser().getId(),
                member.getUser().getEmail(),
                member.getUser().getFirstName(),
                member.getUser().getLastName(),
                member.getRole(),
                member.getCreatedAt(),
                projects);
    }

    private Company getCompanyForViewer(UUID companyId, User requester) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Company not found: " + companyId));

        if (company.getOwner() != null && company.getOwner().getId().equals(requester.getId())) {
            return company;
        }

        if (!companyMemberService.isMemberOfCompany(requester.getId(), companyId)) {
            throw new AppExceptions.ForbiddenException("You are not a member of this company");
        }

        CompanyRole role = companyMemberService.getRole(companyId, requester.getId());
        if (role != CompanyRole.ADMIN && role != CompanyRole.ACCOUNT_OWNER) {
            throw new AppExceptions.ForbiddenException("Only company ADMINs can view company members");
        }

        return company;
    }

    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }
}
