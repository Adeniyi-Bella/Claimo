package com.claimo.api.paymentitem.dto.request;

import com.claimo.api.projects.enums.JobStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateJobStatusRequest(
    @NotNull JobStatus status
) {}
