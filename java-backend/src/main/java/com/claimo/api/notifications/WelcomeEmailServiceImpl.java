package com.claimo.api.notifications;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import com.claimo.api.config.properties.ResendWelcomeEmailProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

@Service
@Slf4j
public class WelcomeEmailServiceImpl implements WelcomeEmailService {

    private static final String EMAIL_PATH = "/emails";
    private static final String RESEND_BASE_URL = "https://api.resend.com";
    private static final int MAX_ATTEMPTS = 3;
    private static final long RETRY_DELAY_MILLIS = 500L;
    private static final String FROM_NAME_TEMPLATE = "%s <%s>";

    private final ResendWelcomeEmailProperties properties;
    private final HttpClient httpClient;

    public WelcomeEmailServiceImpl(ResendWelcomeEmailProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    @Async
    public void sendWelcomeEmail(UUID userId, String email, String firstName, String lastName) {
        sendWelcomeEmailWithRetry(userId, email, firstName, lastName);
    }

    void sendWelcomeEmailWithRetry(UUID userId, String email, String firstName, String lastName) {
        String recipientName = resolveRecipientName(firstName, lastName, email);
        String htmlBody = buildHtmlBody(recipientName);
        String textBody = buildTextBody(recipientName);
        String from = formatFromHeader();

        int attempt = 1;
        while (attempt <= MAX_ATTEMPTS) {
            try {
                sendOnce(from, email, htmlBody, textBody);
                log.info("Sent welcome email userId={} email={} attempts={}", userId, email, attempt);
                return;
            } catch (WelcomeEmailException ex) {
                if (!ex.retryable() || attempt >= MAX_ATTEMPTS) {
                    logFailure(userId, email, recipientName, attempt, ex);
                    return;
                }

                log.warn("Retrying welcome email userId={} email={} attempt={}/{} status={} body={}",
                        userId, email, attempt, MAX_ATTEMPTS, ex.statusCode(), ex.responseBody());

                sleepBeforeRetry();
                attempt++;
            }
        }
    }

    private void sendOnce(String from, String email, String htmlBody, String textBody) {
        String json = """
                {"from":"%s","to":"%s","subject":"Welcome to %s","html":"%s","text":"%s"}
                """.formatted(from, email, properties.appName(),
                htmlBody.replace("\"", "\\\"").replace("\n", "\\n"),
                textBody.replace("\"", "\\\"").replace("\n", "\\n"));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_BASE_URL + EMAIL_PATH))
                .header("Authorization", "Bearer " + properties.apiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();

            if (status >= 400) {
                boolean retryable = status >= 500 || status == 429;
                throw new WelcomeEmailException(String.valueOf(status), response.body(), retryable, null);
            }
        } catch (WelcomeEmailException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new WelcomeEmailException(null, null, true, ex); // network error, retryable
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new WelcomeEmailException(null, null, false, ex);
        }
    }

    private void logFailure(UUID userId, String email, String recipientName, int attempt,
            WelcomeEmailException ex) {
        if (!ex.retryable()) {
            log.warn(
                    "Welcome email rejected userId={} email={} name={} attempt={} status={} body={}",
                    userId, email, recipientName, attempt, ex.statusCode(), ex.responseBody());
            return;
        }

        log.error(
                "Welcome email failed after retries userId={} email={} name={} attempts={} status={} body={}",
                userId, email, recipientName, attempt, ex.statusCode(), ex.responseBody(), ex);
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(RETRY_DELAY_MILLIS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private String formatFromHeader() {
        return FROM_NAME_TEMPLATE.formatted(properties.appName(), properties.fromEmail());
    }

    private String resolveRecipientName(String firstName, String lastName, String email) {
        String fullName = (StringUtils.hasText(firstName) ? firstName.trim() : "")
                + (StringUtils.hasText(lastName) ? " " + lastName.trim() : "");
        fullName = fullName.trim();
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }

        int atIndex = email.indexOf("@");
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private String buildHtmlBody(String recipientName) {
        String escapedName = HtmlUtils.htmlEscape(recipientName, StandardCharsets.UTF_8.name());
        String escapedAppName = HtmlUtils.htmlEscape(properties.appName(), StandardCharsets.UTF_8.name());

        return """
                <html>
                  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
                    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
                      <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to %s</h1>
                      <p>Hi %s,</p>
                      <p>Your account is ready. You can sign in and start tracking your work right away.</p>
                      <p style="margin-top: 24px;">Thanks,<br/>The %s team</p>
                    </div>
                  </body>
                </html>
                """.formatted(escapedAppName, escapedName, escapedAppName);
    }

    private String buildTextBody(String recipientName) {
        return "Hi %s,%n%nYour account is ready. You can sign in and start tracking your work right away.%n%nThanks,%nThe %s team"
                .formatted(recipientName, properties.appName());
    }

    private static final class WelcomeEmailException extends RuntimeException {
        private final String statusCode;
        private final String responseBody;
        private final boolean retryable;

        private WelcomeEmailException(String statusCode, String responseBody, boolean retryable, Throwable cause) {
            super(cause);
            this.statusCode = statusCode;
            this.responseBody = responseBody;
            this.retryable = retryable;
        }

        private String statusCode() {
            return statusCode;
        }

        private String responseBody() {
            return responseBody;
        }

        private boolean retryable() {
            return retryable;
        }
    }
}
