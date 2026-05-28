package com.claimo.api.company.controller;

import com.claimo.api.company.dto.CurrentCompanyDto;
import com.claimo.api.company.dto.requests.CompanyRequests;
import com.claimo.api.company.services.CompanyInviteService;
import com.claimo.api.company.services.CompanyService;
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

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Companies", description = "Company management")
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyInviteService companyInviteService;

    @GetMapping("/profile")
    @Operation(summary = "Get the authenticated user's company", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Company returned successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Company not found")
    })
    public ResponseEntity<CustomApiResponse<CurrentCompanyDto>> getMyCompany(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(CustomApiResponse.success(companyService.getMembersInCompany(jwt)));
    }

    @PostMapping("/{companyId}/members")
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

    @DeleteMapping("/{companyId}/members/invites/{inviteId}")
    @Operation(summary = "Cancel a pending company invite", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Invite cancelled successfully"),
            @ApiResponse(responseCode = "400", description = "Invite is not pending"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Invite not found")
    })
    public ResponseEntity<Void> cancelInvite(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID companyId,
            @PathVariable UUID inviteId) {
        companyInviteService.cancelInvitation(jwt, companyId, inviteId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{companyId}/members/{userId}")
    @Operation(summary = "Remove a member from a company", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Member removed successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot remove yourself"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Member not found")
    })
    public ResponseEntity<Void> removeMemberFromCompany(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID companyId,
            @PathVariable UUID userId) {
        companyService.removeMemberFromCompany(jwt, companyId, userId);
        return ResponseEntity.noContent().build();
    }
}