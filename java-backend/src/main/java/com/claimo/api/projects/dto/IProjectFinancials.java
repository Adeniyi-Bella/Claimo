package com.claimo.api.projects.dto;

import java.math.BigDecimal;
import java.util.UUID;

public interface IProjectFinancials {
    UUID getProjectId();

    BigDecimal getContractValue();

    BigDecimal getApproved();

    BigDecimal getSubmitted();

    BigDecimal getRejected();
}