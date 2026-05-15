package com.claimo.api.company.dto.response;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.projects.enums.PendingInviteStatus;

import java.time.Instant;
import java.util.UUID;

public class CompanyInviteResponses {

    public record CompanyInvite(
            UUID id,
            String email,
            CompanyRole role,
            PendingInviteStatus status,
            Instant createdAt,
            Instant acceptedAt,
            UUID invitedByUserId,
            String invitedByEmail) {
    }
}
