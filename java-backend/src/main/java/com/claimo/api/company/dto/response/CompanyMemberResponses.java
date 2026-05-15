package com.claimo.api.company.dto.response;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.projects.enums.ProjectRole;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CompanyMemberResponses {

    public record CompanyMember(
            UUID userId,
            String email,
            String firstName,
            String lastName,
            CompanyRole companyRole,
            Instant companyJoinedAt,
            List<ProjectMembership> projects) {
    }

    public record ProjectMembership(
            UUID projectId,
            String projectName,
            ProjectRole role,
            Instant joinedAt) {
    }
}
