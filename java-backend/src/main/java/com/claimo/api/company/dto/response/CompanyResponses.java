package com.claimo.api.company.dto.response;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.enums.CompanyRole;

public class CompanyResponses {

    public record CurrentCompany(
            CompanyDto company,
            CompanyRole role) {
    }
}
