package com.claimo.api.company.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.company.enums.CompanyInviteStatus;
import com.claimo.api.company.enums.CompanyRole;

public record CompanyPendingInvites(
        UUID inviteId,
        String email,
        CompanyRole role,
        CompanyInviteStatus status,
        Instant createdAt) {

}
