package com.claimo.api.webhooks.clerk;

import com.claimo.api.company.invites.CompanyInviteService;
import com.claimo.api.user.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyInviteWebhookService {

    private final ClerkWebhookPayloadService payloadService;
    private final CompanyInviteService companyInviteService;
    private final UserService userService;

    @Transactional
    public void handleInvitationCreated(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.requiredText(
                data, "id", "Clerk invitation id is missing from the webhook payload");

        companyInviteService.recordInvitationCreated(email, clerkInvitationId);
    }

    @Transactional
    public void handleInvitationAccepted(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.extractOptionalText(data, "id");

        userService.findByEmail(email)
                .ifPresentOrElse(
                        user -> companyInviteService.acceptAndFinalizeInvitation(email, clerkInvitationId, user),
                        () -> companyInviteService.acceptInvitation(email, clerkInvitationId));
    }

    @Transactional
    public void handleInvitationRevoked(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.extractOptionalText(data, "id");

        companyInviteService.revokeInvitation(email, clerkInvitationId);
    }
}
