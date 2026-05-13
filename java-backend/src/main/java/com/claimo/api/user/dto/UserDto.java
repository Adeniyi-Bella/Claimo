package com.claimo.api.user.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.user.model.User;

public record UserDto(
        UUID id,
        String clerkUserId,
        String email,
        String firstName,
        String lastName,
        Instant createdAt,
        Instant updatedAt) {

    public static UserDto fromEntity(User user) {
        return new UserDto(
                user.getId(),
                user.getClerkUserId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
