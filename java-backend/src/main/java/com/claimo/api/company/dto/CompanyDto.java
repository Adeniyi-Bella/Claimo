package com.claimo.api.company.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.company.model.Company;

public record CompanyDto(
        UUID id,
        String name,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt) {

    public static CompanyDto fromEntity(Company company) {
        return new CompanyDto(
                company.getId(),
                company.getName(),
                company.getOwner() == null ? null : company.getOwner().getId(),
                company.getCreatedAt(),
                company.getUpdatedAt());
    }
}
