package com.claimo.api.webhooks.clerk;

import com.claimo.api.auth.properties.ClerkProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClerkSignatureVerifier {

    private final ClerkProperties clerkProperties;

    /**
     * Verifies the Clerk webhook signature using HMAC-SHA256.
     * The signed content is: "{svix-id}.{svix-timestamp}.{payload}"
     */
    public boolean verify(
            String svixId,
            String svixTimestamp,
            String svixSignature,
            String payload,
            String webhookSecret) {

        try {
            String secret = webhookSecret.replace("whsec_", "");
            byte[] secretBytes = Base64.getDecoder().decode(secret);
            String signedContent = svixId + "." + svixTimestamp + "." + payload;

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] expectedBytes = mac.doFinal(signedContent.getBytes());
            String expectedSignature = "v1," + Base64.getEncoder().encodeToString(expectedBytes);

            for (String sig : svixSignature.split(" ")) {
                if (sig.equals(expectedSignature)) {
                    return true;
                }
            }
            return false;

        } catch (Exception e) {
            log.error("Signature verification failed", e);
            return false;
        }
    }

    public boolean verifyUserCreated(String svixId, String svixTimestamp, String svixSignature, String payload) {
        return verify(svixId, svixTimestamp, svixSignature, payload, clerkProperties.userCreatedWebhookSecret());
    }

    public boolean verifyInvitationCreated(String svixId, String svixTimestamp, String svixSignature, String payload) {
        return verify(svixId, svixTimestamp, svixSignature, payload, clerkProperties.invitationCreatedWebhookSecret());
    }

    public boolean verifyInvitationAccepted(String svixId, String svixTimestamp, String svixSignature, String payload) {
        return verify(svixId, svixTimestamp, svixSignature, payload, clerkProperties.invitationAcceptedWebhookSecret());
    }

    public boolean verifyInvitationRevoked(String svixId, String svixTimestamp, String svixSignature, String payload) {
        return verify(svixId, svixTimestamp, svixSignature, payload, clerkProperties.invitationRevokedWebhookSecret());
    }
}
