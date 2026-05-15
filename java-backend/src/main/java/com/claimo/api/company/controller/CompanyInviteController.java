package com.claimo.api.company.controller;

import com.claimo.api.company.dto.response.CompanyInviteResponses;
import com.claimo.api.company.invites.CompanyInviteViewService;
import com.claimo.api.exceptions.CustomApiResponse;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies/{companyId}/invites")
@RequiredArgsConstructor
@Tag(name = "Company Invites", description = "Company invite management")
public class CompanyInviteController {

    private final CompanyInviteViewService companyInviteViewService;

    @GetMapping
    @Operation(summary = "Get all invites for a company", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Company invites returned successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Company not found")
    })
    public ResponseEntity<CustomApiResponse<List<CompanyInviteResponses.CompanyInvite>>> getInvites(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID companyId) {
        List<CompanyInviteResponses.CompanyInvite> invites = companyInviteViewService.getCompanyInvites(jwt, companyId);
        return ResponseEntity.ok(CustomApiResponse.success(invites));
    }
}
