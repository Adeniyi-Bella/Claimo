package com.claimo.api.projects.dto;

import com.claimo.api.projects.enums.ClaimDecision;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ClaimDto(
        UUID id,
        int sequence,
        BigDecimal amount,
        String description,
        ClaimDecision status,
        String submittedBy,
        String submittedById,
        Instant submittedAt,
        String decidedBy,
        String decidedById,
        Instant decidedAt,
        String decisionNote,
        Instant paidAt) {
}