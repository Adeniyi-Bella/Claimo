package com.claimo.api.webhooks.clerk;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhooks", description = "Endpoints for receiving external webhook events")
public class WebhookController {

    private final WebhookService webhookService;
    private final ClerkSignatureVerifier signatureVerifier;

    @PostMapping("/clerk")
    @Operation(summary = "Receive Clerk webhook events")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event processed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature"),
            @ApiResponse(responseCode = "500", description = "Failed to process event")
    })
    public ResponseEntity<Void> handleClerkWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload) {

        if (!signatureVerifier.verify(svixId, svixTimestamp, svixSignature, payload)) {
            log.warn("Invalid Clerk webhook signature");
            return ResponseEntity.status(401).build();
        }

        webhookService.handleUserCreated(payload);
        return ResponseEntity.ok().build();
    }
}
