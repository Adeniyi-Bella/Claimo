package com.claimo.api.webhooks.clerk;

import com.claimo.api.company.services.CompanyInviteService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClerkInvitationWebhookService {

    private final ClerkWebhookPayloadService payloadService;
    private final CompanyInviteService companyInviteService;
    private final ProjectInviteWebhookService projectInviteWebhookService;

    public void handleInvitationCreated(String payload) {
        dispatch(payload, InvitationEventType.CREATED);
    }

    public void handleInvitationAccepted(String payload) {
        dispatch(payload, InvitationEventType.ACCEPTED);
    }

    public void handleInvitationRevoked(String payload) {
        dispatch(payload, InvitationEventType.REVOKED);
    }

    private void dispatch(String payload, InvitationEventType eventType) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String email = payloadService.requiredEmail(data);
        String clerkInvitationId = payloadService.extractOptionalText(data, "id");

        boolean companyInvite = !companyInviteService.findInvites(clerkInvitationId, email).isEmpty();
        if (companyInvite) {
            routeCompany(eventType, payload);
            return;
        }

        routeProject(eventType, payload);
    }

    private void routeCompany(InvitationEventType eventType, String payload) {
        switch (eventType) {
            case CREATED -> companyInviteService.handleInvitationCreated(payload);
            case ACCEPTED -> companyInviteService.handleInvitationAccepted(payload);
            case REVOKED -> companyInviteService.handleInvitationRevoked(payload);
        }
    }

    private void routeProject(InvitationEventType eventType, String payload) {
        switch (eventType) {
            case CREATED -> projectInviteWebhookService.handleInvitationCreated(payload);
            case ACCEPTED -> projectInviteWebhookService.handleInvitationAccepted(payload);
            case REVOKED -> projectInviteWebhookService.handleInvitationRevoked(payload);
        }
    }

    private enum InvitationEventType {
        CREATED,
        ACCEPTED,
        REVOKED
    }
}
