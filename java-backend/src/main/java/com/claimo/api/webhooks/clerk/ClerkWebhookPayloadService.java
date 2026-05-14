package com.claimo.api.webhooks.clerk;

import com.claimo.api.exceptions.AppExceptions;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClerkWebhookPayloadService {

    private final ObjectMapper objectMapper;

    public JsonNode parse(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (JsonProcessingException e) {
            throw new AppExceptions.BadRequestException("Malformed Clerk webhook JSON payload");
        }
    }

    public String requiredText(JsonNode node, String fieldName, String errorMessage) {
        String value = node.path(fieldName).asText("");
        if (value.isBlank()) {
            throw new AppExceptions.BadRequestException(errorMessage);
        }
        return value;
    }

    public String extractOptionalText(JsonNode node, String fieldName) {
        String value = node.path(fieldName).asText("");
        return value.isBlank() ? null : value;
    }

    public String requiredEmail(JsonNode data) {
        JsonNode emailAddresses = data.path("email_addresses");
        if (!emailAddresses.isArray() || emailAddresses.isEmpty()) {
            String directEmail = data.path("email_address").asText("");
            if (!directEmail.isBlank()) {
                return directEmail;
            }
            throw new AppExceptions.BadRequestException(
                    "Clerk webhook payload must include at least one email address");
        }

        String email = emailAddresses.path(0).path("email_address").asText("");
        if (email.isBlank()) {
            email = data.path("email_address").asText("");
        }
        if (email.isBlank()) {
            throw new AppExceptions.BadRequestException("Clerk webhook email address is missing");
        }
        return email;
    }
}
