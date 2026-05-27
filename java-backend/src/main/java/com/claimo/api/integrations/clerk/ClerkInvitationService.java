package com.claimo.api.integrations.clerk;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import com.claimo.api.config.properties.ClerkConfigProperties;
import com.claimo.api.exceptions.AppExceptions;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClerkInvitationService {

    private static final URI INVITATIONS_URI = URI.create("https://api.clerk.com/v1/invitations");

    private final ClerkConfigProperties clerkProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public String sendInvitation(String emailAddress) {
        try {
            ObjectNode bodyNode = objectMapper.createObjectNode();
            bodyNode.put("email_address", emailAddress);
            bodyNode.put("redirect_url", clerkProperties.invitationRedirectUrl());
            bodyNode.put("ignore_existing", true);

            String body = objectMapper.writeValueAsString(bodyNode);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(INVITATIONS_URI)
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + clerkProperties.secretKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();

            if (statusCode >= 200 && statusCode < 300) {
                String invitationId = objectMapper.readTree(response.body()).path("id").asText("");
                if (invitationId.isBlank()) {
                    throw new AppExceptions.BadGatewayException(
                            "Clerk invitation response did not include an invitation id");
                }
                return invitationId;
            }

            log.error("Clerk invitation failed status={} body={}", statusCode, response.body());

            String clerkError = "";
            try {
                clerkError = objectMapper.readTree(response.body())
                        .path("errors").path(0).path("long_message").asText("");
            } catch (Exception ignored) {
            }

            if (statusCode == 400) {
                throw new AppExceptions.BadRequestException(
                        clerkError.isBlank()
                                ? "Invalid invitation request for email: " + emailAddress
                                : clerkError);
            }

            if (statusCode == 409 || statusCode == 422) {
                throw new AppExceptions.ConflictException(
                        clerkError.isBlank()
                                ? "Clerk already has an invitation or account for email: " + emailAddress
                                : clerkError);
            }

            throw new AppExceptions.BadGatewayException(
                    "Clerk invitation request failed with status " + statusCode);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppExceptions.GatewayTimeoutException(
                    "Interrupted while sending Clerk invitation for email: " + emailAddress);
        } catch (IOException e) {
            throw new AppExceptions.BadGatewayException(
                    "Failed to send Clerk invitation for email: " + emailAddress);
        }
    }
}
