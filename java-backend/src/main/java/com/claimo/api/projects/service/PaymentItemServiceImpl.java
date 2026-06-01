package com.claimo.api.projects.service;

import com.claimo.api.auth.AuthHelper;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.PaymentItemResponseDto;
import com.claimo.api.projects.dto.requests.CreatePaymentItemRequest;
import com.claimo.api.projects.enums.JobStatus;
import com.claimo.api.projects.enums.PaymentStatus;
import com.claimo.api.projects.models.PaymentItem;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectModel;
import com.claimo.api.projects.repository.PaymentItemRepository;
import com.claimo.api.projects.repository.ProjectMemberRepository;
import com.claimo.api.projects.repository.ProjectModelRepository;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.UserRepository;
import com.claimo.api.user.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                        () -> new AppExceptions.ForbiddenException("Only project admins can create payment items"));

        ProjectModel model = projectModelRepository.findById(request.modelId())
                .filter(m -> m.getProject().getId().equals(projectId))
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException("Model not found in this project"));

        if (paymentItemRepository.existsByModel_IdAndCategory(model.getId(), request.category())) {
            throw new AppExceptions.ConflictException(
                    "A payment item for \"" + request.category() + "\" already exists on this model");
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

    private PaymentItemResponseDto toPaymentItemDetails(PaymentItem item) {
        return new PaymentItemResponseDto(
                item.getId(),
                item.getCategory(),
                item.getModel().getId().toString(),
                item.getModel().getFileName(),
                item.getContractor().getId().toString(),
                item.getContractor().getFirstName() + " " + item.getContractor().getLastName(),
                item.getApprover().getId().toString(),
                item.getApprover().getFirstName() + " " + item.getApprover().getLastName(),
                item.getContractValue(),
                item.getDescription(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                List.of(),
                List.of(),
                item.getJobStatus(),
                item.getPaymentStatus(),
                item.isPaymentConfirmationPending(),
                List.of());
    }
}