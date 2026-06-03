package com.claimo.api.paymentitem.dto.request;

import com.claimo.api.projects.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePaymentStatusRequest(
    @NotNull PaymentStatus status
) {}
