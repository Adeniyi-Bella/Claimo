package com.claimo.api.paymentitem.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

import com.claimo.api.projects.enums.PaymentItemCategory;

public record CreatePaymentItemRequest(
        @NotNull UUID modelId,
        @NotNull PaymentItemCategory category,
        UUID contractorId,
        UUID approverId,
        @NotNull @Positive BigDecimal contractValue,
        String description) {
}
