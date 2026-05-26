package com.claimo.api.user.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.enums.CompanyRole;

public record DashboardResponse(
        UserSummary user,
        CompanySummary company,
        List<ProjectSummary> projects) {

    public record UserSummary(
            UUID id,
            String name,
            String email,
            int avatarHue) {
    }

    public record CompanySummary(
            CompanyDto company,
            CompanyRole role) {
    }

    public record ProjectSummary(
            UUID id,
            String name,
            String description,
            String location,
            LocalDate startDate,
            String status,
            List<MemberSummary> members,
            List<ModelSummary> models) {
    }

    public record MemberSummary(
            UUID id,
            String name,
            String email,
            String role,
            String joined,
            int avatarHue) {
    }

    public record ModelSummary(
            UUID id,
            String name,
            String fileType,
            String fileUrl,
            Instant uploadedAt,
            String uploadedBy,
            List<PaymentItemSummary> paymentItems) {
    }

    public record PaymentItemSummary(
            UUID id,
            String category,
            String modelId,
            String modelName,
            String contractorId,
            String contractorName,
            String approverId,
            String approverName,
            double contractValue,
            String description,
            Instant createdAt,
            Instant updatedAt,
            List<ClaimSummary> claims,
            List<String> attachedElementIds,
            String jobStatus,
            String paymentStatus,
            boolean paymentConfirmationPending,
            List<AuditEntrySummary> auditTrail) {
    }

    public record ClaimSummary(
            UUID id,
            int sequence,
            double amount,
            String description,
            String status,
            String submittedBy,
            String submittedById,
            Instant submittedAt,
            String decidedBy,
            String decidedById,
            Instant decidedAt,
            String decisionNote,
            Instant paidAt) {
    }

    public record AuditEntrySummary(
            UUID id,
            Instant timestamp,
            String actorId,
            String actorName,
            String actorRole,
            String action,
            String field,
            String fromValue,
            String toValue) {
    }
}
