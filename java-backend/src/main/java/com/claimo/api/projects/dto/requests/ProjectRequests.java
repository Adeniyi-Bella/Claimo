package com.claimo.api.projects.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.enums.ProjectStatus;

public class ProjectRequests {

        public record CreateProject(
                        @NotBlank(message = "Project name is required") @Size(min = 2, max = 100, message = "Project name must be between 2 and 100 characters") @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-.,()&']+$", message = "Project name contains invalid characters") String name,

                        @Size(max = 500, message = "Description must be under 500 characters") String description,

                        @Size(max = 100, message = "Location must be under 100 characters") @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-.,()&']+$", message = "Location contains invalid characters") String location,

                        LocalDate startDate) {
        }

        public record UpdateProject(
                        @Size(max = 255) String name,
                        String description,
                        String location,
                        LocalDate startDate,
                        ProjectStatus status) {
        }

        public record InviteMember(
                        @NotBlank(message = "Full name is required") String fullName,
                        @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,

                        @NotNull(message = "Role is required") ProjectRole role) {
        }
}
