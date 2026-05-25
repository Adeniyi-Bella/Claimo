package com.claimo.api.config.properties;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "resend")
@Validated
public record ResendWelcomeEmailProperties(

        @NotBlank(message = "mail.welcome.api-key is required. Add RESEND_API_KEY to your environment.")
        String apiKey,

        @NotBlank(message = "mail.welcome.from-email is required. Add RESEND_FROM_EMAIL to your environment.")
        String fromEmail,

        @NotBlank(message = "mail.welcome.app-name is required. Add APP_NAME to your environment.")
        String appName
) {}
