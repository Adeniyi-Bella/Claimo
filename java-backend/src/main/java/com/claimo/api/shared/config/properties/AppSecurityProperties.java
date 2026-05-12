package com.claimo.api.shared.config.properties;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app.security")
@Validated
public record AppSecurityProperties(String issuerUri,
                List<String> allowedOrigins,
                List<String> publicEndpoints) {
}
