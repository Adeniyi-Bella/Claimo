package com.claimo.api.projects.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class ProjectRequests {

    public record CreateProject(
            @NotBlank(message = "Project name is required") @Size(max = 255) String name,
            String description,
            String location,
            LocalDate startDate) {
    }

    public record UpdateProject(
            @Size(max = 255) String name,
            String description,
            String location,
            LocalDate startDate) {
    }
}
