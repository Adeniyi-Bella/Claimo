package com.claimo.api.shared.config.properties;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ratelimit")
public record AppRateLimitProperties(
    int requestsPerMinute,
    int windowSeconds,
    List<String> excludePaths
) {
}
