package com.claimo.api.paymentitem.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.claimo.api.paymentitem.entity.PaymentItem;
import com.claimo.api.projects.enums.PaymentItemCategory;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentItemRepository extends JpaRepository<PaymentItem, UUID> {

    @EntityGraph(attributePaths = {
            "project",
            "model",
            "contractor",
            "approver",
            "claims",
            "auditTrail"
    })
    List<PaymentItem> findAllByProject_IdIn(List<UUID> projectIds);

    boolean existsByModel_IdAndCategory(UUID modelId, PaymentItemCategory category);

    @EntityGraph(attributePaths = {
            "project",
            "model",
            "contractor",
            "approver",
            "claims",
            "auditTrail"
    })
    Optional<PaymentItem> findWithDetailsById(UUID id);
}
