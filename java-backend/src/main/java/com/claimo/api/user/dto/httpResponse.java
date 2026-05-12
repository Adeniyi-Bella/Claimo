package com.claimo.api.user.dto;

import java.time.Instant;
import java.util.UUID;

public class httpResponse {
    public record UserProfileResponse(
            UUID userId,
            String clerkUserId,
            String role,
            UUID companyId,
            String companyName,
            Instant createdAt) {
    }
}
