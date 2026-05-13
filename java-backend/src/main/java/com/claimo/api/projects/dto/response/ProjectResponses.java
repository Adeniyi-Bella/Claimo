package com.claimo.api.projects.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class ProjectResponses {

    public record Project(
            UUID id,
            String name,
            String description,
            String location,
            LocalDate startDate,
            UUID companyId,
            UUID createdBy,
            Instant createdAt,
            Instant updatedAt) {
    }
}
