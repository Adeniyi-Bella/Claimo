package com.claimo.api.paymentitem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record SubmitClaimRequest(
        @NotNull @Positive BigDecimal amount,
        @NotBlank String description) {
}
