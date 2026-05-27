package com.claimo.api.projects.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.projects.dto.MemberDto;
import com.claimo.api.projects.dto.ModelDto;


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

    public record ProjectSummary(
            UUID id,
            String name,
            String description,
            String location,
            LocalDate startDate,
            String status,
            List<MemberDto> members,
            List<ModelDto> models) {
    }
}
