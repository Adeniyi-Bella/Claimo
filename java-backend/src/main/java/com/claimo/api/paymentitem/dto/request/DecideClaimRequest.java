package com.claimo.api.paymentitem.dto.request;

import com.claimo.api.projects.enums.ClaimDecision;
import jakarta.validation.constraints.NotNull;

public record DecideClaimRequest(
    @NotNull ClaimDecision decision,
    String note
) {}
