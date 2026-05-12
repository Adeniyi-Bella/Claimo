package com.claimo.api.user.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.user.model.User;
import com.claimo.api.user.enums.UserRole;

public record UserDto(
        UUID id,
        String clerkUserId,
        CompanyDto company,
        UserRole role,
        Instant createdAt,
        Instant updatedAt) {

    public static UserDto fromEntity(User user) {
        return new UserDto(
                user.getId(),
                user.getClerkUserId(),
                CompanyDto.fromEntity(user.getCompany()),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
