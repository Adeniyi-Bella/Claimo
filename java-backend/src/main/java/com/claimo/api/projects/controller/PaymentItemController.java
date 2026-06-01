package com.claimo.api.projects.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.projects.dto.PaymentItemResponseDto;
import com.claimo.api.projects.dto.requests.CreatePaymentItemRequest;
import com.claimo.api.projects.service.PaymentItemService;

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
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Payment Items", description = "Payment item management")
public class PaymentItemController {

    private final PaymentItemService paymentItemService;

    @PostMapping("/{projectId}/payment-items")
    @Operation(summary = "Create a payment item", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Payment item created"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Project or model not found"),
            @ApiResponse(responseCode = "409", description = "Duplicate category on model")
    })
    public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> createPaymentItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreatePaymentItemRequest request) {

        PaymentItemResponseDto response = paymentItemService.createPaymentItem(jwt, projectId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CustomApiResponse.success(response));
    }
}