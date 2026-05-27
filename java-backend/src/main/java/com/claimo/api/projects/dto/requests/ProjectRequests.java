package com.claimo.api.projects.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

import com.claimo.api.projects.enums.ProjectRole;

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

        public record InviteMember(
                        @NotBlank(message = "Full name is required") String fullName,
                        @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,

                        @NotNull(message = "Role is required") ProjectRole role) {
        }
}
