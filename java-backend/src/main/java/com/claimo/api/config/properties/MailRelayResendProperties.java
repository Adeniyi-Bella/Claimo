package com.claimo.api.config.properties;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "mail.relay.resend")
@Validated
public record MailRelayResendProperties(

        @NotBlank(message = "mail.relay.resend.api-key is required. Add RESEND_API_KEY to your environment.")
        String apiKey,

        @NotBlank(message = "mail.relay.resend.from-email is required. Add RESEND_FROM_EMAIL to your environment.")
        String fromEmail
) {}
