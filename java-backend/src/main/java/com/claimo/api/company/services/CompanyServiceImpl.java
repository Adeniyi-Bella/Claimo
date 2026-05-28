package com.claimo.api.company.services;

import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.dto.CompanyMemberDto;
import com.claimo.api.company.dto.CompanyPendingInvites;
import com.claimo.api.company.dto.CurrentCompanyDto;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.invites.CompanyInviteRepository;
import com.claimo.api.company.membership.CompanyMember;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.company.model.Company;
import com.claimo.api.company.model.CompanyInvite;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.models.ProjectMember;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberService companyMemberService;
    private final UserService userService;
    private final CompanyInviteRepository companyInviteRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    @Transactional
    public Company createCompany(String name, User owner) {
        Company company = new Company();
        company.setName(name);
        company.setOwner(owner);
        return companyRepository.save(company);
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentCompanyDto getCompanyWithMembers(Jwt jwt) {
        User user = getAuthenticatedUser(jwt);
        Company company = getCurrentCompanyEntity(user);
        CompanyRole role = getCurrentCompanyRole(company, user);

        List<CompanyMember> members = companyMemberService.findByCompanyId(company.getId());
        List<CompanyInvite> invites = companyInviteRepository.findAllByCompany_Id(company.getId());

        List<CompanyMemberDto> memberSummaries = members.stream()
                .map(m -> new CompanyMemberDto(
                        m.getUser().getId(),
                        m.getUser().getFirstName(),
                        m.getUser().getLastName(),
                        m.getUser().getEmail(),
                        m.getRole()))
                .toList();
        List<CompanyPendingInvites> pendingInvites = invites.stream()
                .map(i -> new CompanyPendingInvites(
                        i.getId(),
                        i.getEmail(),
                        i.getRole(),
                        i.getStatus(),
                        i.getCreatedAt()))
                .toList();

        return new CurrentCompanyDto(company.getId(), company.getName(), role, memberSummaries, pendingInvites);
    }

    private User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }

    private Company getCurrentCompanyEntity(User user) {
        return companyRepository.findByOwner_Id(user.getId())
                .orElseGet(() -> {
                    List<CompanyMember> memberships = companyMemberService.findByUserId(user.getId());
                    if (memberships.isEmpty()) {
                        throw new AppExceptions.ResourceNotFoundException(
                                "Company not found for userId: " + user.getId());
                    }
                    return memberships.get(0).getCompany();
                });
    }

    // CompanyServiceImpl
@Override
@Transactional
public void removeMemberFromCompany(Jwt jwt, UUID companyId, UUID userId) {
    User requester = getAuthenticatedUser(jwt);
    Company company = getCurrentCompanyEntity(requester);

    if (company.getOwner() == null || !company.getOwner().getId().equals(requester.getId())) {
        throw new AppExceptions.ForbiddenException("Only the account owner can remove members");
    }

    if (requester.getId().equals(userId)) {
        throw new AppExceptions.BadRequestException("You cannot remove yourself from the company");
    }

    List<ProjectMember> projectMemberships = projectMemberRepository
            .findAllByProject_Company_Id(companyId)
            .stream()
            .filter(pm -> pm.getUser().getId().equals(userId))
            .toList();
    projectMemberRepository.deleteAll(projectMemberships);

    companyMemberService.removeMember(companyId, userId);
}

    private CompanyRole getCurrentCompanyRole(Company company, User user) {
        if (company.getOwner() != null && company.getOwner().getId().equals(user.getId())) {
            return CompanyRole.ACCOUNT_OWNER;
        }

        List<CompanyMember> memberships = companyMemberService.findByCompanyId(company.getId());

        return memberships.stream()
                .filter(member -> member.getUser().getId().equals(user.getId()))
                .map(CompanyMember::getRole)
                .findFirst()
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Company member not found for companyId=" + company.getId() + " userId=" + user.getId()));
    }
}
