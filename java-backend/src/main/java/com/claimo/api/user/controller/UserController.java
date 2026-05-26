package com.claimo.api.user.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.user.dto.DashboardResponse;
import com.claimo.api.user.dto.UserProfileResponse;
import com.claimo.api.user.service.UserService;
import com.claimo.api.user.service.DashboardService;

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
    private final DashboardService dashboardService;

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

    @GetMapping("/dashboard")
    @Operation(summary = "Get authenticated user dashboard data",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard returned successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User or company not found")
    })
    public ResponseEntity<CustomApiResponse<DashboardResponse>> getDashboard(
            @AuthenticationPrincipal Jwt jwt) {
        DashboardResponse dashboard = dashboardService.getDashboard(jwt);
        return ResponseEntity.ok(CustomApiResponse.success(dashboard));
    }
}
