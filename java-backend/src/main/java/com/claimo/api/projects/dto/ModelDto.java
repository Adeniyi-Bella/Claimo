package com.claimo.api.projects.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ModelDto(
        UUID id,
        String name,
        String fileType,
        String fileUrl,
        Instant uploadedAt,
        String uploadedBy,
        List<PaymentItemResponseDto> paymentItems) {
}
