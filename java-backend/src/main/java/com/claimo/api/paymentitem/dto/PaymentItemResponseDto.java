package com.claimo.api.paymentitem.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.claimo.api.projects.enums.JobStatus;
import com.claimo.api.projects.enums.PaymentItemCategory;
import com.claimo.api.projects.enums.PaymentStatus;

public record PaymentItemResponseDto(
        UUID id,
        PaymentItemCategory category,
        String modelId,
        String modelName,
        String contractorId,
        String contractorName,
        String approverId,
        String approverName,
        BigDecimal contractValue,
        String description,
        Instant createdAt,
        Instant updatedAt,
        List<ClaimDto> claims,
        List<String> attachedElementIds,
        JobStatus jobStatus,
        PaymentStatus paymentStatus,
        boolean paymentConfirmationPending,
        List<AuditEntryDto> auditTrail) {
}