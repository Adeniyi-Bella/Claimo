package com.claimo.api.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@ConfigurationProperties(prefix = "clerk")
@Validated
public record ClerkConfigProperties(
                @NotBlank(message = "Clerk secret key is required") String secretKey,

                @NotBlank(message = "Clerk invitation redirect URL is required") String invitationRedirectUrl,

                @NotBlank(message = "Clerk user.created webhook secret is required") String userCreatedWebhookSecret,
                @NotBlank(message = "Clerk user.deleted webhook secret is required") String userDeletedWebhookSecret,

                @NotBlank(message = "Clerk invitation.created webhook secret is required") String invitationCreatedWebhookSecret,

                @NotBlank(message = "Clerk invitation.accepted webhook secret is required") String invitationAcceptedWebhookSecret,

                @NotBlank(message = "Clerk invitation.revoked webhook secret is required") String invitationRevokedWebhookSecret) {
}
