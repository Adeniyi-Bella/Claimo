package com.claimo.api.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserProfileResponse(
        UUID userId,
        String clerkUserId,
        String email,
        String firstName,
        String lastName,
        Instant createdAt,
        List<CompanyMembershipResponse> companies) {

    public record CompanyMembershipResponse(
            UUID companyId,
            String companyName,
            String role) {
    }
}
