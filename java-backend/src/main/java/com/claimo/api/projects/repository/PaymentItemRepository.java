package com.claimo.api.projects.repository;

import java.util.List;
import java.util.UUID;

import com.claimo.api.projects.enums.PaymentItemCategory;
import com.claimo.api.projects.models.PaymentItem;

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
}
