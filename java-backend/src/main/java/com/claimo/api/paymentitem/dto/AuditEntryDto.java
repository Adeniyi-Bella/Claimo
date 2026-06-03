package com.claimo.api.paymentitem.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.projects.enums.AuditField;
import com.claimo.api.projects.enums.ProjectRole;

public record AuditEntryDto(
        UUID id,
        Instant timestamp,
        String actorId,
        String actorName,
        ProjectRole actorRole,
        String action,
        AuditField field,
        String fromValue,
        String toValue) {
}