package com.claimo.api.projects.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.projects.enums.AuditField;
import com.claimo.api.projects.enums.ClaimDecision;
import com.claimo.api.projects.enums.JobStatus;
import com.claimo.api.projects.enums.PaymentStatus;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.enums.ProjectRole;

public class ProjectResponses {
        public record ProjectDetails(
                        UUID id,
                        String name,
                        String description,
                        String location,
                        LocalDate startDate,
                        String status,
                        List<Member> members,
                        List<Model> models,
                        List<PendingInvite> pendingInvites,
                        ProjectRole currentUserRole,
                        CompanyRole currentUserCompanyRole) {
        }

        public record PendingInvite(
                        UUID id,
                        String email,
                        ProjectRole role,
                        String invitedByName,
                        PendingInviteStatus status,
                        Instant createdAt) {
        }

        public record Member(
                        UUID id,
                        String name,
                        String email,
                        ProjectRole role,
                        String joined,
                        int avatarHue) {
        }

        public record Model(
                        UUID id,
                        String name,
                        String fileType,
                        String fileUrl,
                        Instant uploadedAt,
                        String uploadedBy,
                        List<PaymentItemResponse> paymentItems) {
        }

        public record PaymentItemResponse(
                        UUID id,
                        String category,
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
                        List<Claim> claims,
                        List<String> attachedElementIds,
                        JobStatus jobStatus,
                        PaymentStatus paymentStatus,
                        boolean paymentConfirmationPending,
                        List<AuditEntry> auditTrail) {
        }

        public record Claim(
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

        public record AuditEntry(
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
}
