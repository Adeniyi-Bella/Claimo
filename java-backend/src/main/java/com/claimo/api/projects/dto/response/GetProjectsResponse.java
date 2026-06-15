package com.claimo.api.projects.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record GetProjectsResponse(
        UUID id,
        String name,
        String description,
        String location,
        LocalDate startDate,
        String status,
        int memberCount,
        int modelCount,
        Financials financials) {

    public record Financials(
            BigDecimal contractValue,
            BigDecimal approved,
            BigDecimal submitted,
            BigDecimal rejected) {
    }
}
