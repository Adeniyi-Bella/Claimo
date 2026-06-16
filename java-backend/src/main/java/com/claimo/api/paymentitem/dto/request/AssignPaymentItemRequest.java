package com.claimo.api.paymentitem.dto.request;

import java.util.UUID;

public record AssignPaymentItemRequest(
        UUID contractorId,
        UUID approverId
) {}