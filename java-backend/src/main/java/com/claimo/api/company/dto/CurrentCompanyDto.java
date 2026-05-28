package com.claimo.api.company.dto;

import com.claimo.api.company.enums.CompanyRole;
import java.util.List;
import java.util.UUID;

public record CurrentCompanyDto(
        UUID companyId,
        String companyName,
        CompanyRole role,
        List<CompanyMemberDto> members) {
}