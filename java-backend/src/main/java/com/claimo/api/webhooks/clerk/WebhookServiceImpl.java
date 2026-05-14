package com.claimo.api.webhooks.clerk;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebhookServiceImpl implements WebhookService {

    private final ClerkUserWebhookService clerkUserWebhookService;
    private final ClerkInvitationWebhookService clerkInvitationWebhookService;

    @Override
    public void handleUserCreated(String payload) {
        clerkUserWebhookService.handleUserCreated(payload);
    }

    @Override
    public void handleInvitationCreated(String payload) {
        clerkInvitationWebhookService.handleInvitationCreated(payload);
    }

    @Override
    public void handleInvitationAccepted(String payload) {
        clerkInvitationWebhookService.handleInvitationAccepted(payload);
    }

    @Override
    public void handleInvitationRevoked(String payload) {
        clerkInvitationWebhookService.handleInvitationRevoked(payload);
    }
}
