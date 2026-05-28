package com.claimo.api.webhooks.clerk;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.company.services.CompanyInviteService;
import com.claimo.api.company.services.CompanyService;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.notifications.WelcomeEmailService;
import com.claimo.api.projects.invites.ProjectInviteService;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClerkUserWebhookService {

    private final UserService userService;
    private final CompanyService companyService;
    private final CompanyInviteService companyInviteService;
    private final ClerkWebhookPayloadService payloadService;
    private final ProjectInviteService projectInviteService;
    private final WelcomeEmailService welcomeEmailService;

    @Transactional
    public void handleUserCreated(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String clerkUserId = payloadService.requiredText(
                data, "id", "Clerk user id is missing from the webhook payload");
        String email = payloadService.requiredEmail(data);

        if (userService.existsByClerkUserId(clerkUserId)) {
            log.warn("User already exists for clerkUserId={}, skipping", clerkUserId);
            return;
        }

        String firstName = data.path("first_name").asText("");
        String lastName = data.path("last_name").asText("");
        String fullName = (firstName + " " + lastName).trim();

        User user = createUserAndCompany(data, clerkUserId, email, firstName, lastName, fullName);

        welcomeEmailService.sendWelcomeEmail(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());

        log.info("Created company and user for clerkUserId={}", clerkUserId);
    }

    private User createUserAndCompany(JsonNode data, String clerkUserId, String email,
            String firstName, String lastName, String fullName) {

        User user = userService.createUser(clerkUserId, email, firstName, lastName);

        // Always create own company
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

        var company = companyService.createCompany(companyName, user);
        companyService.addMember(company, user, CompanyRole.ACCOUNT_OWNER);

        // Then add to any invited companies
        companyInviteService.markUserCreatedInvitesAccepted(email, user);
        projectInviteService.markUserCreatedInvitesAccepted(email, user);

        log.info("Created user and company for clerkUserId={}", clerkUserId);

        return user;
    }

    @Transactional
    public void handleUserDeleted(String payload) {
        JsonNode root = payloadService.parse(payload);
        JsonNode data = root.path("data");

        String clerkUserId = payloadService.requiredText(
                data, "id", "Clerk user id is missing from the webhook payload");

        String email = userService.findByClerkUserId(clerkUserId)
                .map(User::getEmail)
                .orElseGet(() -> payloadService.extractOptionalText(data, "email_address"));

        if (email == null || email.isBlank()) {
            log.warn("User deleted webhook missing resolvable email for clerkUserId={}, skipping cleanup", clerkUserId);
            return;
        }

        email = email.toLowerCase().trim();

        userService.deleteAllUserDataByClerkUserIdAndEmail(clerkUserId, email);

        log.info("Deleted user and related data for clerkUserId={} email={}", clerkUserId, email);
    }
}
