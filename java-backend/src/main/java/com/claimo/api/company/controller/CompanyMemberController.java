package com.claimo.api.company.controller;

import com.claimo.api.company.dto.requests.CompanyRequests;
import com.claimo.api.company.dto.response.CompanyMemberResponses;
import com.claimo.api.company.invites.CompanyInviteService;
import com.claimo.api.company.membership.CompanyMemberViewService;
import com.claimo.api.exceptions.CustomApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/companies/{companyId}/members")
@RequiredArgsConstructor
@Tag(name = "Company Members", description = "Company member management")
public class CompanyMemberController {

    private final CompanyInviteService companyInviteService;
    private final CompanyMemberViewService companyMemberViewService;

    @PostMapping
    @Operation(summary = "Invite a member to a company", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Member invited successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Company not found"),
            @ApiResponse(responseCode = "409", description = "User already a member")
    })
    public ResponseEntity<CustomApiResponse<Void>> inviteMember(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID companyId,
            @Valid @RequestBody CompanyRequests.InviteMember request) {
        companyInviteService.inviteMember(jwt, companyId, request.email(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(CustomApiResponse.success(null));
    }

    @GetMapping
    @Operation(summary = "Get all members of a company with project memberships", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Company members returned successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Company not found")
    })
    public ResponseEntity<CustomApiResponse<List<CompanyMemberResponses.CompanyMember>>> getMembers(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID companyId) {
        List<CompanyMemberResponses.CompanyMember> members = companyMemberViewService.getCompanyMembers(jwt, companyId);
        return ResponseEntity.ok(CustomApiResponse.success(members));
    }
}
