package com.claimo.api.company.services;

import com.claimo.api.company.dto.CurrentCompanyDto;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.model.Company;
import com.claimo.api.user.model.User;
import com.claimo.api.company.model.CompanyMember;

import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;

public interface CompanyService {
    Company createCompany(String name, User owner);

    CurrentCompanyDto getMembersInCompany(Jwt jwt);

    void removeMemberFromCompany(Jwt jwt, UUID companyId, UUID userId);

    CompanyMember addMember(Company company, User user, CompanyRole role);

    CompanyRole getRole(UUID companyId, UUID userId);

}
