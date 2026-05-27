package com.claimo.api.projects.dto;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.projects.enums.ProjectRole;

public record ProjectMemberDto(
                        UUID userId,
                        String email,
                        String firstName,
                        String lastName,
                        ProjectRole role,
                        Instant createdAt) {
        }
