package com.claimo.api.notifications;

import java.util.UUID;

public interface WelcomeEmailService {
    void sendWelcomeEmail(UUID userId, String email, String firstName, String lastName);
}
