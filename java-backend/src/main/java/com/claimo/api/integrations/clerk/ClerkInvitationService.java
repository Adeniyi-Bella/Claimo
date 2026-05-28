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

    private static final String INVITATIONS_URL = "https://api.clerk.com/v1/invitations";

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

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(INVITATIONS_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + clerkProperties.secretKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(bodyNode)))
                    .build();

            HttpResponse<String> response = executeRequest(request);
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
            String clerkError = parseClerkError(response.body());

            if (statusCode == 400) {
                throw new AppExceptions.BadRequestException(
                        clerkError.isBlank() ? "Invalid invitation request for email: " + emailAddress : clerkError);
            }
            if (statusCode == 409 || statusCode == 422) {
                throw new AppExceptions.ConflictException(
                        clerkError.isBlank() ? "Clerk already has an invitation or account for email: " + emailAddress
                                : clerkError);
            }

            throw new AppExceptions.BadGatewayException("Clerk invitation request failed with status " + statusCode);

        } catch (IOException e) {
            throw new AppExceptions.BadGatewayException("Failed to send Clerk invitation for email: " + emailAddress);
        }
    }

    public void revokeInvitation(String invitationId) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(INVITATIONS_URL + "/" + invitationId + "/revoke"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + clerkProperties.secretKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = executeRequest(request);
        int statusCode = response.statusCode();

        if (statusCode >= 200 && statusCode < 300) {
            log.info("Clerk invitation revoked invitationId={}", invitationId);
            return;
        }

        log.error("Clerk revoke invitation failed status={} body={}", statusCode, response.body());
        String clerkError = parseClerkError(response.body());

        if (statusCode == 404) {
            throw new AppExceptions.ResourceNotFoundException("Clerk invitation not found: " + invitationId);
        }

        throw new AppExceptions.BadGatewayException(
                clerkError.isBlank() ? "Clerk revoke invitation failed with status " + statusCode : clerkError);
    }

    private HttpResponse<String> executeRequest(HttpRequest request) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppExceptions.GatewayTimeoutException("Request interrupted: " + request.uri());
        } catch (IOException e) {
            throw new AppExceptions.BadGatewayException("Request failed: " + request.uri());
        }
    }

    private String parseClerkError(String responseBody) {
        try {
            return objectMapper.readTree(responseBody)
                    .path("errors").path(0).path("long_message").asText("");
        } catch (Exception ignored) {
            return "";
        }
    }
}