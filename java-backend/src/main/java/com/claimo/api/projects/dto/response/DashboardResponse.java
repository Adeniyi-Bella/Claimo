package com.claimo.api.projects.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.enums.CompanyRole;

public record DashboardResponse(
                UserSummary user,
                CompanySummary company,
                List<ProjectSummary> projects) {

        public record UserSummary(
                        UUID id,
                        String name,
                        String email,
                        int avatarHue) {
        }

        public record CompanySummary(
                        CompanyDto company,
                        CompanyRole role) {
        }

        public record Financials(
                        BigDecimal contractValue,
                        BigDecimal approved,
                        BigDecimal submitted,
                        BigDecimal rejected) {
        }

        public record ProjectSummary(
                        UUID id,
                        String name,
                        String location,
                        LocalDate startDate,
                        int modelCount,
                        Financials financials) {
        }
}
