package com.claimo.api.webhooks.clerk.services;

public interface WebhookService {
    void handleUserCreated(String payload);

    void handleInvitationCreated(String payload);

    void handleInvitationAccepted(String payload);

    void handleInvitationRevoked(String payload);
}
