package com.claimo.api.projects.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.claimo.api.projects.enums.ProjectRole;

public class ProjectResponses {

    public record Project(
            UUID id,
            String name,
            String description,
            String location,
            LocalDate startDate,
            UUID companyId,
            UUID createdBy,
            ProjectRole role,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record ProjectMember(
            UUID userId,
            String email,
            String firstName,
            String lastName,
            ProjectRole role,
            Instant createdAt) {
    }
}
