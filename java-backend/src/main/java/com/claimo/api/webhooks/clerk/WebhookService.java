package com.claimo.api.webhooks.clerk;

public interface WebhookService {
    void handleUserCreated(String payload);
}
