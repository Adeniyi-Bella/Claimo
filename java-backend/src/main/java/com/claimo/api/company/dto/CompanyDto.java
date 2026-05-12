package com.claimo.api.company.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.company.model.Company;

public record CompanyDto(
        UUID id,
        String name,
        Instant createdAt,
        Instant updatedAt) {

    public static CompanyDto fromEntity(Company company) {
        return new CompanyDto(
                company.getId(),
                company.getName(),
                company.getCreatedAt(),
                company.getUpdatedAt());
    }
}
