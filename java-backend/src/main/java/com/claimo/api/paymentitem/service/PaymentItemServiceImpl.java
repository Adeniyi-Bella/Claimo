package com.claimo.api.paymentitem.service;

import com.claimo.api.auth.AuthHelper;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.paymentitem.dto.AuditEntryDto;
import com.claimo.api.paymentitem.dto.ClaimDto;
import com.claimo.api.paymentitem.dto.PaymentItemResponseDto;
import com.claimo.api.paymentitem.dto.request.ConfirmPaymentRequest;
import com.claimo.api.paymentitem.dto.request.DecideClaimRequest;
import com.claimo.api.paymentitem.dto.request.SubmitClaimRequest;
import com.claimo.api.paymentitem.dto.request.UpdateJobStatusRequest;
import com.claimo.api.paymentitem.dto.request.UpdatePaymentStatusRequest;
import com.claimo.api.paymentitem.entity.PaymentItem;
import com.claimo.api.paymentitem.entity.PaymentItemAuditEntry;
import com.claimo.api.paymentitem.entity.PaymentItemClaim;
import com.claimo.api.paymentitem.repository.PaymentItemAuditEntryRepository;
import com.claimo.api.paymentitem.repository.PaymentItemClaimRepository;
import com.claimo.api.paymentitem.repository.PaymentItemRepository;
import com.claimo.api.projects.dto.requests.CreatePaymentItemRequest;
import com.claimo.api.projects.enums.AuditField;
import com.claimo.api.projects.enums.ClaimDecision;
import com.claimo.api.projects.enums.JobStatus;
import com.claimo.api.projects.enums.PaymentStatus;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectModel;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.projects.repository.ProjectModelRepository;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.UserRepository;
import com.claimo.api.user.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentItemServiceImpl implements PaymentItemService {

        private final AuthHelper authHelper;
        private final ProjectRepository projectRepository;
        private final ProjectModelRepository projectModelRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final PaymentItemRepository paymentItemRepository;
        private final UserRepository userRepository;
        private final PaymentItemClaimRepository paymentItemClaimRepository;
        private final PaymentItemAuditEntryRepository auditEntryRepository;

        @Override
        @Transactional
        public PaymentItemResponseDto createPaymentItem(
                        Jwt jwt,
                        UUID projectId,
                        CreatePaymentItemRequest request) {

                User currentUser = authHelper.getAuthenticatedUser(jwt);

                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Project not found"));

                // Only SUPER_ADMIN or ADMIN on this project can create payment items
                projectMemberRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId())
                                .filter(m -> m.getRole().name().equals("SUPER_ADMIN")
                                                || m.getRole().name().equals("ADMIN"))
                                .orElseThrow(
                                                () -> new AppExceptions.ForbiddenException(
                                                                "Only project admins can create payment items"));

                ProjectModel model = projectModelRepository.findById(request.modelId())
                                .filter(m -> m.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Model not found in this project"));

                if (paymentItemRepository.existsByModel_IdAndCategory(model.getId(), request.category())) {
                        throw new AppExceptions.ConflictException(
                                        "A payment item for \"" + request.category()
                                                        + "\" already exists on this model");
                }

                User contractor = userRepository.findById(request.contractorId())
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Contractor not found"));

                User approver = userRepository.findById(request.approverId())
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Approver not found"));

                Instant now = Instant.now();
                PaymentItem item = new PaymentItem();
                item.setProject(project);
                item.setModel(model);
                item.setCategory(request.category());
                item.setContractor(contractor);
                item.setApprover(approver);
                item.setContractValue(request.contractValue());
                item.setDescription(request.description());
                item.setJobStatus(JobStatus.NOT_STARTED);
                item.setPaymentStatus(PaymentStatus.NONE);
                item.setPaymentConfirmationPending(false);
                item.setCreatedAt(now);
                item.setUpdatedAt(now);

                PaymentItem saved = paymentItemRepository.save(item);

                return toPaymentItemDetails(saved);
        }

        @Override
        @Transactional(readOnly = true)
        public PaymentItemResponseDto getPaymentItemById(Jwt jwt, UUID projectId, UUID itemId) {
                User currentUser = authHelper.getAuthenticatedUser(jwt);

                // Verify project exists and user is a member
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Project not found"));

                projectMemberRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId())
                                .orElseThrow(() -> new AppExceptions.ForbiddenException("Access denied"));

                PaymentItem item = paymentItemRepository.findWithDetailsById(itemId)
                                .filter(i -> i.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Payment item not found"));

                return toPaymentItemDetails(item);
        }

        @Override
        @Transactional
        public PaymentItemResponseDto submitClaim(
                        Jwt jwt, UUID projectId, UUID itemId, SubmitClaimRequest request) {

                User currentUser = authHelper.getAuthenticatedUser(jwt);

                PaymentItem item = paymentItemRepository.findWithDetailsById(itemId)
                                .filter(i -> i.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Payment item not found"));

                // Only assigned approver or SUPER_ADMIN
                boolean isSuperAdmin = projectMemberRepository
                                .findByProjectIdAndUserId(projectId, currentUser.getId())
                                .map(m -> m.getRole().name().equals("SUPER_ADMIN"))
                                .orElse(false);

                boolean isAssignedApprover = isSameUser(item.getApprover(), currentUser);

                if (!isSuperAdmin && !isAssignedApprover) {
                        throw new AppExceptions.ForbiddenException(
                                        "Only the assigned approver or a super admin can decide claims");
                }

                // Block if a claim is already pending
                if (paymentItemClaimRepository.existsByPaymentItem_IdAndStatus(itemId, ClaimDecision.SUBMITTED)) {
                        throw new AppExceptions.ConflictException(
                                        "A claim is already pending approval. Wait for a decision before submitting another.");
                }

                // Block if contract value is already fully claimed
                BigDecimal totalApproved = item.getClaims().stream()
                                .filter(c -> c.getStatus() == ClaimDecision.APPROVED)
                                .map(PaymentItemClaim::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalApproved.compareTo(item.getContractValue()) >= 0) {
                        throw new AppExceptions.ConflictException("Contract value fully claimed");
                }

                int sequence = paymentItemClaimRepository.countByPaymentItem_Id(itemId) + 1;
                Instant now = Instant.now();

                PaymentItemClaim claim = new PaymentItemClaim();
                claim.setPaymentItem(item);
                claim.setSequence(sequence);
                claim.setAmount(request.amount());
                claim.setDescription(request.description());
                claim.setStatus(ClaimDecision.SUBMITTED);
                claim.setSubmittedBy(currentUser.getFirstName() + " " + currentUser.getLastName());
                claim.setSubmittedById(currentUser.getId().toString());
                claim.setSubmittedAt(now);

                paymentItemClaimRepository.save(claim);

                item.setUpdatedAt(now);
                paymentItemRepository.save(item);

                return toPaymentItemDetails(item);
        }

        @Override
        @Transactional
        public PaymentItemResponseDto decideClaim(
                        Jwt jwt, UUID projectId, UUID itemId, UUID claimId,
                        DecideClaimRequest request) {

                User currentUser = authHelper.getAuthenticatedUser(jwt);
                String actorName = currentUser.getFirstName() + " " + currentUser.getLastName();

                PaymentItem item = paymentItemRepository.findWithDetailsById(itemId)
                                .filter(i -> i.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Payment item not found"));

                // Only assigned approver or SUPER_ADMIN
                boolean isSuperAdmin = projectMemberRepository
                                .findByProjectIdAndUserId(projectId, currentUser.getId())
                                .map(m -> m.getRole().name().equals("SUPER_ADMIN"))
                                .orElse(false);

                boolean isAssignedApprover = isSameUser(item.getApprover(), currentUser);

                if (!isSuperAdmin && !isAssignedApprover) {
                        throw new AppExceptions.ForbiddenException(
                                        "Only the assigned approver or a super admin can decide claims");
                }

                PaymentItemClaim claim = item.getClaims().stream()
                                .filter(c -> c.getId().equals(claimId))
                                .findFirst()
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Claim not found"));

                if (claim.getStatus() != ClaimDecision.SUBMITTED) {
                        throw new AppExceptions.ConflictException("Only pending claims can be decided");
                }

                if (request.decision() == ClaimDecision.REJECTED
                                && (request.note() == null || request.note().isBlank())) {
                        throw new AppExceptions.BadRequestException("Rejection reason is required");
                }

                Instant now = Instant.now();
                claim.setStatus(request.decision());
                claim.setDecidedBy(currentUser.getFirstName() + " " + currentUser.getLastName());
                claim.setDecidedById(currentUser.getId().toString());
                claim.setDecidedAt(now);
                claim.setDecisionNote(request.note());
                paymentItemClaimRepository.save(claim);

                item.setUpdatedAt(now);
                paymentItemRepository.save(item);

                PaymentItemAuditEntry entry = new PaymentItemAuditEntry();
                entry.setPaymentItem(item);
                entry.setTimestamp(now);
                entry.setActorId(currentUser.getId().toString());
                entry.setActorName(actorName);
                entry.setActorRole(ProjectRole.APPROVER);
                entry.setField(AuditField.CLAIM);
                entry.setFromValue("SUBMITTED");
                entry.setToValue(request.decision().name());
                entry.setAction(
                                request.decision() == ClaimDecision.APPROVED
                                                ? "Approved claim #" + claim.getSequence() + " for " + claim.getAmount()
                                                : "Rejected claim #" + claim.getSequence() + " — \"" + request.note()
                                                                + "\"");
                auditEntryRepository.save(entry);

                return toPaymentItemDetails(item);
        }

        @Override
        @Transactional
        public PaymentItemResponseDto updateJobStatus(
                        Jwt jwt, UUID projectId, UUID itemId,
                        UpdateJobStatusRequest request) {

                User currentUser = authHelper.getAuthenticatedUser(jwt);
                String actorName = currentUser.getFirstName() + " " + currentUser.getLastName();

                PaymentItem item = paymentItemRepository.findWithDetailsById(itemId)
                                .filter(i -> i.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Payment item not found"));

                // Only assigned contractor or SUPER_ADMIN
                boolean isSuperAdmin = projectMemberRepository
                                .findByProjectIdAndUserId(projectId, currentUser.getId())
                                .map(m -> m.getRole().name().equals("SUPER_ADMIN"))
                                .orElse(false);

                boolean isAssignedContractor = isSameUser(item.getContractor(), currentUser);

                if (!isSuperAdmin && !isAssignedContractor) {
                        throw new AppExceptions.ForbiddenException(
                                        "Only the assigned contractor or a super admin can update job status");
                }

                item.setJobStatus(request.status());
                item.setUpdatedAt(Instant.now());

                PaymentItemAuditEntry entry = new PaymentItemAuditEntry();
                entry.setPaymentItem(item);
                entry.setTimestamp(Instant.now());
                entry.setActorId(currentUser.getId().toString());
                entry.setActorName(actorName);
                entry.setActorRole(isSuperAdmin ? ProjectRole.SUPER_ADMIN : ProjectRole.CONTRACTOR);
                entry.setField(AuditField.JOB_STATUS);
                entry.setFromValue(item.getJobStatus().name());
                entry.setToValue(request.status().name());
                entry.setAction("Set job status to " + request.status().name().replace("_", " ").toLowerCase());
                auditEntryRepository.save(entry);

                paymentItemRepository.save(item);

                return toPaymentItemDetails(item);
        }

        @Override
        @Transactional
        public PaymentItemResponseDto updatePaymentStatus(
                        Jwt jwt, UUID projectId, UUID itemId,
                        UpdatePaymentStatusRequest request) {

                User currentUser = authHelper.getAuthenticatedUser(jwt);
                String actorName = currentUser.getFirstName() + " " + currentUser.getLastName();

                PaymentItem item = paymentItemRepository.findWithDetailsById(itemId)
                                .filter(i -> i.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Payment item not found"));

                // Only assigned approver or SUPER_ADMIN
                boolean isSuperAdmin = projectMemberRepository
                                .findByProjectIdAndUserId(projectId, currentUser.getId())
                                .map(m -> m.getRole().name().equals("SUPER_ADMIN"))
                                .orElse(false);

                boolean isAssignedApprover = isSameUser(item.getApprover(), currentUser);

                if (!isSuperAdmin && !isAssignedApprover) {
                        throw new AppExceptions.ForbiddenException(
                                        "Only the assigned approver or a super admin can update payment status");
                }

                boolean isPaid = request.status() == PaymentStatus.PAID;

                item.setPaymentStatus(request.status());
                item.setPaymentConfirmationPending(isPaid);
                item.setUpdatedAt(Instant.now());

                PaymentItemAuditEntry entry = new PaymentItemAuditEntry();
                entry.setPaymentItem(item);
                entry.setTimestamp(Instant.now());
                entry.setActorId(currentUser.getId().toString());
                entry.setActorName(actorName);
                entry.setActorRole(isSuperAdmin ? ProjectRole.SUPER_ADMIN : ProjectRole.APPROVER);
                entry.setField(AuditField.PAYMENT_STATUS);
                entry.setFromValue(item.getPaymentStatus().name());
                entry.setToValue(request.status().name());
                entry.setAction(
                                request.status() == PaymentStatus.PAID
                                                ? "Marked payment as paid — awaiting contractor confirmation"
                                                : "Reset payment status to " + request.status().name().toLowerCase());
                auditEntryRepository.save(entry);

                paymentItemRepository.save(item);

                return toPaymentItemDetails(item);
        }

        @Override
        @Transactional
        public PaymentItemResponseDto confirmPayment(
                        Jwt jwt, UUID projectId, UUID itemId,
                        ConfirmPaymentRequest request) {

                User currentUser = authHelper.getAuthenticatedUser(jwt);

                PaymentItem item = paymentItemRepository.findWithDetailsById(itemId)
                                .filter(i -> i.getProject().getId().equals(projectId))
                                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                                                "Payment item not found"));

                boolean isSuperAdmin = projectMemberRepository
                                .findByProjectIdAndUserId(projectId, currentUser.getId())
                                .map(m -> m.getRole().name().equals("SUPER_ADMIN"))
                                .orElse(false);

                boolean isAssignedContractor = isSameUser(item.getContractor(), currentUser);

                if (!isSuperAdmin && !isAssignedContractor) {
                        throw new AppExceptions.ForbiddenException(
                                        "Only the assigned contractor or a super admin can confirm payment");
                }

                if (!item.isPaymentConfirmationPending()) {
                        throw new AppExceptions.ConflictException("No payment confirmation is pending");
                }

                Instant now = Instant.now();
                String actorName = currentUser.getFirstName() + " " + currentUser.getLastName();

                PaymentItemAuditEntry entry = new PaymentItemAuditEntry();
                entry.setPaymentItem(item);
                entry.setTimestamp(now);
                entry.setActorId(currentUser.getId().toString());
                entry.setActorName(actorName);
                entry.setActorRole(ProjectRole.CONTRACTOR);
                entry.setField(AuditField.PAYMENT_STATUS);
                entry.setFromValue("PAID");

                if (request.confirmed()) {
                        entry.setAction("Confirmed receipt of payment");
                        entry.setToValue("PAID");
                        item.setPaymentStatus(PaymentStatus.PAID);
                } else {
                        entry.setAction("Disputed payment — reported as not received");
                        entry.setToValue("REJECTED");
                        item.setPaymentStatus(PaymentStatus.REJECTED);
                }

                item.setPaymentConfirmationPending(false);
                item.setUpdatedAt(now);

                auditEntryRepository.save(entry);
                paymentItemRepository.save(item);

                return toPaymentItemDetails(item);
        }

        private PaymentItemResponseDto toPaymentItemDetails(PaymentItem item) {
                List<ClaimDto> claims = item.getClaims().stream()
                                .sorted(java.util.Comparator.comparingInt(PaymentItemClaim::getSequence))
                                .map(this::toClaimDto)
                                .toList();

                List<AuditEntryDto> auditTrail = item.getAuditTrail().stream()
                                .sorted(java.util.Comparator.comparing(
                                                PaymentItemAuditEntry::getTimestamp))
                                .map(this::toAuditEntryDto)
                                .toList();

                return new PaymentItemResponseDto(
                                item.getId(),
                                item.getCategory(),
                                item.getModel().getId().toString(),
                                item.getModel().getFileName(),
                                item.getContractor() == null ? null : item.getContractor().getId().toString(),
                                displayName(item.getContractor()),
                                item.getApprover() == null ? null : item.getApprover().getId().toString(),
                                displayName(item.getApprover()),
                                item.getContractValue(),
                                item.getDescription(),
                                item.getCreatedAt(),
                                item.getUpdatedAt(),
                                claims,
                                List.of(),
                                item.getJobStatus(),
                                item.getPaymentStatus(),
                                item.isPaymentConfirmationPending(),
                                auditTrail);
        }

        private ClaimDto toClaimDto(PaymentItemClaim c) {
                return new ClaimDto(
                                c.getId(),
                                c.getSequence(),
                                c.getAmount(),
                                c.getDescription(),
                                c.getStatus(),
                                c.getSubmittedBy(),
                                c.getSubmittedById(),
                                c.getSubmittedAt(),
                                c.getDecidedBy(),
                                c.getDecidedById(),
                                c.getDecidedAt(),
                                c.getDecisionNote(),
                                c.getPaidAt());
        }

        private AuditEntryDto toAuditEntryDto(PaymentItemAuditEntry e) {
                return new AuditEntryDto(
                                e.getId(),
                                e.getTimestamp(),
                                e.getActorId(),
                                e.getActorName(),
                                e.getActorRole(),
                                e.getAction(),
                                e.getField(),
                                e.getFromValue(),
                                e.getToValue());
        }

        private boolean isSameUser(User candidate, User currentUser) {
                return candidate != null && candidate.getId().equals(currentUser.getId());
        }

        private String displayName(User user) {
                if (user == null) {
                        return null;
                }
                String firstName = user.getFirstName();
                String lastName = user.getLastName();
                if (firstName != null && !firstName.isBlank() && lastName != null && !lastName.isBlank()) {
                        return firstName + " " + lastName;
                }
                if (firstName != null && !firstName.isBlank()) {
                        return firstName;
                }
                if (lastName != null && !lastName.isBlank()) {
                        return lastName;
                }
                return user.getEmail();
        }

}
