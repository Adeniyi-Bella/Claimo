package com.claimo.api.projects.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.projects.dto.MemberDto;
import com.claimo.api.projects.dto.ModelDto;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.enums.ProjectStatus;

public class ProjectResponses {
        public record ProjectDetails(
                        UUID id,
                        String name,
                        String description,
                        String location,
                        LocalDate startDate,
                        ProjectStatus status,
                        List<MemberDto> members,
                        List<ModelDto> models,
                        List<PendingInvite> pendingInvites,
                        ProjectRole currentUserRole,
                        CompanyRole currentUserCompanyRole) {
        }

        public record PendingInvite(
                        UUID id,
                        String email,
                        ProjectRole role,
                        String invitedByName,
                        PendingInviteStatus status,
                        Instant createdAt) {
        }

        
}
