package com.claimo.api.webhooks.clerk;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.company.services.CompanyService;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.user.enums.UserRole;
import com.claimo.api.user.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataAccessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookServiceImpl implements WebhookService {

    private final UserService userService;
    private final CompanyService companyService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void handleUserCreated(String payload) {
        try {
            JsonNode data = objectMapper.readTree(payload).path("data");
            String clerkUserId = requiredText(data, "id", "Clerk user id is missing from the webhook payload");

            if (userService.existsByClerkUserId(clerkUserId)) {
                log.warn("User already exists for clerkUserId={}, skipping", clerkUserId);
                return;
            }

            String firstName = data.path("first_name").asText("");
            String lastName = data.path("last_name").asText("");
            String fullName = (firstName + " " + lastName).trim();

            String companyName = data
                    .path("unsafe_metadata")
                    .path("company_name")
                    .asText(fullName);

            if (companyName.isBlank()) {
                if (fullName.isBlank()) {
                    throw new AppExceptions.BadRequestException(
                            "Clerk webhook payload must include a company name or user name");
                }
                companyName = fullName;
            }

            CompanyDto company = companyService.createCompany(companyName);
            userService.createUser(clerkUserId, company, UserRole.ACCOUNT_OWNER);

            log.info("Created company and user for clerkUserId={}", clerkUserId);

        } catch (JsonProcessingException e) {
            log.warn("Malformed Clerk webhook JSON payload", e);
            throw new AppExceptions.BadRequestException("Malformed Clerk webhook JSON payload");
        } catch (AppExceptions.BadRequestException e) {
            log.warn("Invalid Clerk webhook payload: {}", e.getMessage());
            throw e;
        } catch (DataAccessException e) {
            log.error("Database failure while handling user.created webhook", e);
            throw new AppExceptions.ServiceUnavailableException(
                    "Database temporarily unavailable while processing user.created webhook");
        } catch (Exception e) {
            log.error("Failed to handle user.created webhook", e);
            throw new AppExceptions.InternalServerErrorException(
                    "Failed to process user.created event");
        }
    }

    private String requiredText(JsonNode node, String fieldName, String errorMessage) {
        String value = node.path(fieldName).asText("");
        if (value.isBlank()) {
            throw new AppExceptions.BadRequestException(errorMessage);
        }
        return value;
    }
}
