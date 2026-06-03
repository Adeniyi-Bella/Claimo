package com.claimo.api.paymentitem.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.paymentitem.dto.PaymentItemResponseDto;
import com.claimo.api.paymentitem.dto.request.ConfirmPaymentRequest;
import com.claimo.api.paymentitem.dto.request.DecideClaimRequest;
import com.claimo.api.paymentitem.dto.request.SubmitClaimRequest;
import com.claimo.api.paymentitem.dto.request.UpdateJobStatusRequest;
import com.claimo.api.paymentitem.dto.request.UpdatePaymentStatusRequest;
import com.claimo.api.paymentitem.service.PaymentItemService;
import com.claimo.api.projects.dto.requests.CreatePaymentItemRequest;

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

        @GetMapping("/{projectId}/payment-items/{itemId}")
        @Operation(summary = "Get a payment item by ID", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Payment item returned"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Payment item not found")
        })
        public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> getPaymentItemById(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID itemId) {
                return ResponseEntity.ok(CustomApiResponse.success(
                                paymentItemService.getPaymentItemById(jwt, projectId, itemId)));
        }

        @PostMapping("/{projectId}/payment-items/{itemId}/claims")
        @Operation(summary = "Submit a claim", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Claim submitted"),
                        @ApiResponse(responseCode = "400", description = "Invalid request"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Payment item not found"),
                        @ApiResponse(responseCode = "409", description = "Claim already pending or contract fully claimed")
        })
        public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> submitClaim(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID itemId,
                        @Valid @RequestBody SubmitClaimRequest request) {
                return ResponseEntity.status(HttpStatus.CREATED).body(CustomApiResponse.success(
                                paymentItemService.submitClaim(jwt, projectId, itemId, request)));
        }

        @PostMapping("/{projectId}/payment-items/{itemId}/claims/{claimId}/decide")
        @Operation(summary = "Approve or reject a claim", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Claim decided"),
                        @ApiResponse(responseCode = "400", description = "Invalid request or missing rejection note"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Payment item or claim not found"),
                        @ApiResponse(responseCode = "409", description = "Claim is not in pending state")
        })
        public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> decideClaim(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID itemId,
                        @PathVariable UUID claimId,
                        @Valid @RequestBody DecideClaimRequest request) {
                return ResponseEntity.ok(CustomApiResponse.success(
                                paymentItemService.decideClaim(jwt, projectId, itemId, claimId, request)));
        }

        @PatchMapping("/{projectId}/payment-items/{itemId}/job-status")
        @Operation(summary = "Update job status", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Job status updated"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Payment item not found")
        })
        public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> updateJobStatus(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID itemId,
                        @Valid @RequestBody UpdateJobStatusRequest request) {
                return ResponseEntity.ok(CustomApiResponse.success(
                                paymentItemService.updateJobStatus(jwt, projectId, itemId, request)));
        }

        @PatchMapping("/{projectId}/payment-items/{itemId}/payment-status")
        @Operation(summary = "Update payment status", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Payment status updated"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Payment item not found")
        })
        public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> updatePaymentStatus(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID itemId,
                        @Valid @RequestBody UpdatePaymentStatusRequest request) {
                return ResponseEntity.ok(CustomApiResponse.success(
                                paymentItemService.updatePaymentStatus(jwt, projectId, itemId, request)));
        }

        @PostMapping("/{projectId}/payment-items/{itemId}/confirm-payment")
        @Operation(summary = "Confirm or dispute payment", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Payment confirmation updated"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Access denied"),
                        @ApiResponse(responseCode = "404", description = "Payment item not found"),
                        @ApiResponse(responseCode = "409", description = "No payment confirmation pending")
        })
        public ResponseEntity<CustomApiResponse<PaymentItemResponseDto>> confirmPayment(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID itemId,
                        @Valid @RequestBody ConfirmPaymentRequest request) {
                return ResponseEntity.ok(CustomApiResponse.success(
                                paymentItemService.confirmPayment(jwt, projectId, itemId, request)));
        }
}