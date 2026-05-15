package com.claimo.api.company.invites;

import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.dto.response.CompanyInviteResponses;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.membership.CompanyMemberService;
import com.claimo.api.company.model.Company;
import com.claimo.api.exceptions.AppExceptions;
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
public class CompanyInviteViewService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberService companyMemberService;
    private final CompanyInviteRepository companyInviteRepository;
    private final UserService userService;

    public List<CompanyInviteResponses.CompanyInvite> getCompanyInvites(Jwt jwt, UUID companyId) {
        User requester = getAuthenticatedUser(jwt);
        Company company = getCompanyForViewer(companyId, requester);

        return companyInviteRepository.findAllByCompany_Id(company.getId()).stream()
                .map(invite -> new CompanyInviteResponses.CompanyInvite(
                        invite.getId(),
                        invite.getEmail(),
                        invite.getRole(),
                        invite.getStatus(),
                        invite.getCreatedAt(),
                        invite.getAcceptedAt(),
                        invite.getInvitedBy() == null ? null : invite.getInvitedBy().getId(),
                        invite.getInvitedBy() == null ? null : invite.getInvitedBy().getEmail()))
                .sorted(Comparator.comparing(CompanyInviteResponses.CompanyInvite::createdAt).reversed())
                .toList();
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
            throw new AppExceptions.ForbiddenException("Only company ADMINs can view company invites");
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
