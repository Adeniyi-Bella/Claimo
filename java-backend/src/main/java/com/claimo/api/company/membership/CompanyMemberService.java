package com.claimo.api.company.membership;

import java.util.List;
import java.util.UUID;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.model.Company;
import com.claimo.api.user.model.User;

public interface CompanyMemberService {
    CompanyMember addMember(Company company, User user, CompanyRole role);

    List<CompanyMember> findByUserId(UUID userId);

    List<CompanyMember> findByCompanyId(UUID companyId);

    boolean isMemberOfCompany(UUID userId, UUID companyId);

    CompanyRole getRole(UUID companyId, UUID userId);

    void removeMember(UUID companyId, UUID userId);

}
