package com.claimo.api.webhooks.clerk;

import com.claimo.api.projects.invites.ProjectInviteService;
import com.claimo.api.user.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectInviteWebhookService {

    private final ClerkWebhookPayloadService payloadService;
    private final ProjectInviteService projectInviteService;
    private final UserService userService;

    @Transactional
    public void handleInvitationCreated(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.requiredText(
                data, "id", "Clerk invitation id is missing from the webhook payload");

        projectInviteService.recordInvitationCreated(email, clerkInvitationId);
    }

    @Transactional
    public void handleInvitationAccepted(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.extractOptionalText(data, "id");

        userService.findByEmail(email)
                .ifPresentOrElse(
                        user -> projectInviteService.acceptAndFinalizeInvitation(email, clerkInvitationId, user),
                        () -> projectInviteService.acceptInvitation(email, clerkInvitationId));
    }

    @Transactional
    public void handleInvitationRevoked(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.extractOptionalText(data, "id");

        projectInviteService.logInvitationRevoked(email, clerkInvitationId);
    }
}
