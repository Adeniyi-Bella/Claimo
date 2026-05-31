package com.claimo.api.user.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.exceptions.AppExceptions.ResourceNotFoundException;
import com.claimo.api.company.services.CompanyInviteService;
import com.claimo.api.projects.service.ProjectInviteService;
import com.claimo.api.user.model.User;
import com.claimo.api.user.dto.UserProfileResponse;
import com.claimo.api.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management")
public class UserController {

    private final UserService userService;
    private final CompanyInviteService companyInviteService;
    private final ProjectInviteService projectInviteService;

    @GetMapping("/profile")
    @Operation(summary = "Get authenticated user profile",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile returned successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<CustomApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal Jwt jwt) {
        UserProfileResponse profile = userService.getProfile(jwt);
        return ResponseEntity.ok(CustomApiResponse.success(profile));
    }

    @PostMapping("/sync-invites")
    @Operation(summary = "Sync accepted company and project invites for the authenticated user",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invites synced successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<CustomApiResponse<Void>> syncInvites(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.findByClerkUserId(jwt.getSubject())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found for clerkUserId: " + jwt.getSubject()));

        String email = user.getEmail().toLowerCase().trim();
        companyInviteService.markUserCreatedInvitesAccepted(email, user);
        projectInviteService.markUserCreatedInvitesAccepted(email, user);

        return ResponseEntity.ok(CustomApiResponse.success(null));
    }
}
