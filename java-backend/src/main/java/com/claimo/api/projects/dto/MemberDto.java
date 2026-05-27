package com.claimo.api.projects.dto;

import java.util.UUID;

import com.claimo.api.projects.enums.ProjectRole;

public record MemberDto(
        UUID id,
        String name,
        String email,
        ProjectRole role,
        String joined,
        int avatarHue) {
}