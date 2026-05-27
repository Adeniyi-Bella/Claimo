package com.claimo.api.company.dto;

import com.claimo.api.company.enums.CompanyRole;
import java.util.UUID;

public record CompanyMemberDto(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        CompanyRole role) {
}