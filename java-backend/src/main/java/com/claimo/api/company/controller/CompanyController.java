package com.claimo.api.company.controller;

import com.claimo.api.company.dto.CurrentCompanyDto;
import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.company.services.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Companies", description = "Company management")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/profile")
    @Operation(summary = "Get the authenticated user's company", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Company returned successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Company not found")
    })
    public ResponseEntity<CustomApiResponse<CurrentCompanyDto>> getMyCompany(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(CustomApiResponse.success(companyService.getCompanyWithMembers(jwt)));
    }
}
