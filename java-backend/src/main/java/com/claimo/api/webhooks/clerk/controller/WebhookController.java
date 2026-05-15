package com.claimo.api.webhooks.clerk.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.claimo.api.webhooks.clerk.ClerkSignatureVerifier;
import com.claimo.api.webhooks.clerk.services.WebhookService;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhooks", description = "Endpoints for receiving external webhook events")
public class WebhookController {

    private final WebhookService webhookService;
    private final ClerkSignatureVerifier signatureVerifier;

    @PostMapping("/clerk/user-created")
    @Operation(summary = "Receive Clerk user.created events")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event processed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature"),
            @ApiResponse(responseCode = "500", description = "Failed to process event")
    })
    public ResponseEntity<Void> handleUserCreatedWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload) {

        if (!signatureVerifier.verifyUserCreated(svixId, svixTimestamp, svixSignature, payload)) {
            log.warn("Invalid Clerk webhook signature");
            return ResponseEntity.status(401).build();
        }

        webhookService.handleUserCreated(payload);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/clerk/invitation-created")
    @Operation(summary = "Receive Clerk invitation.created events")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event processed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature"),
            @ApiResponse(responseCode = "500", description = "Failed to process event")
    })
    public ResponseEntity<Void> handleInvitationCreatedWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload) {

        if (!signatureVerifier.verifyInvitationCreated(svixId, svixTimestamp, svixSignature, payload)) {
            log.warn("Invalid Clerk webhook signature");
            return ResponseEntity.status(401).build();
        }

        webhookService.handleInvitationCreated(payload);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/clerk/invitation-accepted")
    @Operation(summary = "Receive Clerk invitation.accepted events")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event processed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature"),
            @ApiResponse(responseCode = "500", description = "Failed to process event")
    })
    public ResponseEntity<Void> handleInvitationAcceptedWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload) {

        if (!signatureVerifier.verifyInvitationAccepted(svixId, svixTimestamp, svixSignature, payload)) {
            log.warn("Invalid Clerk webhook signature");
            return ResponseEntity.status(401).build();
        }

        webhookService.handleInvitationAccepted(payload);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/clerk/invitation-revoked")
    @Operation(summary = "Receive Clerk invitation.revoked events")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event processed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature"),
            @ApiResponse(responseCode = "500", description = "Failed to process event")
    })
    public ResponseEntity<Void> handleInvitationRevokedWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload) {

        if (!signatureVerifier.verifyInvitationRevoked(svixId, svixTimestamp, svixSignature, payload)) {
            log.warn("Invalid Clerk webhook signature");
            return ResponseEntity.status(401).build();
        }

        webhookService.handleInvitationRevoked(payload);
        return ResponseEntity.ok().build();
    }
}
