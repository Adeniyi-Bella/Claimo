package com.claimo.api.paymentitem.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.paymentitem.entity.PaymentItemClaim;

import java.util.UUID;

public interface PaymentItemClaimRepository extends JpaRepository<PaymentItemClaim, UUID> {
    boolean existsByPaymentItem_IdAndStatus(UUID paymentItemId, com.claimo.api.projects.enums.ClaimDecision status);
    int countByPaymentItem_Id(UUID paymentItemId);
}