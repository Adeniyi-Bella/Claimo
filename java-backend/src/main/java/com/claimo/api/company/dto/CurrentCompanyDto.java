package com.claimo.api.company.dto;

import com.claimo.api.company.enums.CompanyRole;
import java.util.List;

public record CurrentCompanyDto(
        String companyName,
        CompanyRole role,
        List<CompanyMemberDto> members) {
}