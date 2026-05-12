package com.claimo.api.auth.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@ConfigurationProperties(prefix = "clerk")
@Validated
public record ClerkProperties(
        @NotBlank(message = "Clerk secret key is required") String secretKey,

        @NotBlank(message = "Clerk webhook secret is required") String webhookSecret) {
}
