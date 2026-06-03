package com.claimo.api.paymentitem.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.paymentitem.entity.PaymentItemAuditEntry;


public interface PaymentItemAuditEntryRepository extends JpaRepository<PaymentItemAuditEntry, UUID> {
}
