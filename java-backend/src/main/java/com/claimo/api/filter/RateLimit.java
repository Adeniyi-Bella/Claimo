package com.claimo.api.filter;

import com.claimo.api.exceptions.HttpErrorResponder;
import com.claimo.api.shared.config.properties.AppRateLimitProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * RateLimitFilter intercepts every incoming HTTP request and enforces a sliding
 * window rate limit per IP address.
 *
 * How it works:
 * - Each IP address gets a time window (e.g. 60 seconds) and a request counter.
 * - If the counter exceeds the configured limit within the window, the request
 *   is rejected with HTTP 429 Too Many Requests.
 * - Once the window expires, the counter resets automatically on the next request.
 *
 * Limitation: state is stored in memory (ConcurrentHashMap). This means:
 * - Counters reset on app restart.
 * - Does not share state across multiple instances (not suitable for clustered deployments).
 * - For production at scale, replace the map with Redis.
 *
 * This filter runs once per request (OncePerRequestFilter) and is registered
 * before Spring Security's BearerTokenAuthenticationFilter so that rate limiting
 * happens before any authentication attempt.
 */
@Component
@Slf4j
public class RateLimit extends OncePerRequestFilter {

    // Standard rate limit headers returned to the client on every response
    private static final String HEADER_LIMIT = "X-RateLimit-Limit";       // max requests allowed
    private static final String HEADER_REMAINING = "X-RateLimit-Remaining"; // requests left in window
    private static final String HEADER_RESET = "X-RateLimit-Reset";        // seconds until window resets

    /**
     * Holds the state for a single IP address within its current time window.
     *
     * @param count       atomic counter — thread-safe increment without synchronisation
     * @param windowStart the moment this window began, used to detect expiry
     */
    private record RateLimitEntry(AtomicInteger count, Instant windowStart) {}

    /**
     * In-memory store mapping each IP address to its current rate limit entry.
     * ConcurrentHashMap is used because multiple threads may process requests
     * from different IPs simultaneously.
     */
    private final ConcurrentHashMap<String, RateLimitEntry> store = new ConcurrentHashMap<>();

    private final AppRateLimitProperties properties;
    private final HttpErrorResponder httpErrorResponder;

    /**
     * The length of the rate limit window, derived from configuration.
     * Example: if windowSeconds=60, each IP gets N requests per 60 seconds.
     */
    private final Duration window;

    public RateLimit(
            AppRateLimitProperties properties,
            HttpErrorResponder httpErrorResponder) {
        this.properties = properties;
        this.httpErrorResponder = httpErrorResponder;
        this.window = Duration.ofSeconds(properties.windowSeconds());
    }

    /**
     * Skips rate limiting for paths listed in properties.excludePaths().
     * Typically used for health checks, public endpoints, or webhook receivers
     * that should not be throttled.
     *
     * @param request the incoming HTTP request
     * @return true if this request should bypass rate limiting
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return properties.excludePaths().stream().anyMatch(path::endsWith);
    }

    /**
     * Core rate limiting logic. Called once per request that was not excluded.
     *
     * Steps:
     * 1. If rate limiting is disabled in config, pass the request through immediately.
     * 2. Extract the client IP address.
     * 3. Look up or create the rate limit entry for this IP.
     *    - If no entry exists, create a new window starting now with count = 1.
     *    - If the existing window has expired, start a fresh window with count = 1.
     *    - Otherwise, increment the counter in the existing window.
     * 4. Set rate limit headers on the response so clients know their current status.
     * 5. If the counter exceeds the limit, reject with 429 and stop the filter chain.
     * 6. Otherwise, pass the request down the filter chain to authentication and beyond.
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Step 1: bypass entirely if rate limiting is turned off
        if (!properties.enabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Step 2: get the client IP address
        // Note: ensure server.forward-headers-strategy=framework in properties
        // so that X-Forwarded-For is respected when behind a reverse proxy
        String ip = request.getRemoteAddr();
        int limit = properties.requestsPerMinute();
        Instant now = Instant.now();

        // Step 3: atomically update the entry for this IP
        // compute() is atomic on ConcurrentHashMap — no race conditions between
        // checking the entry and updating it
        RateLimitEntry entry = store.compute(ip, (key, existing) -> {
            // No entry yet, or the previous window has expired — start fresh
            if (existing == null || now.isAfter(existing.windowStart().plus(window))) {
                return new RateLimitEntry(new AtomicInteger(1), now);
            }
            // Still within the window — increment the counter
            existing.count().incrementAndGet();
            return existing;
        });

        int current = entry.count().get();
        int remaining = Math.max(0, limit - current);

        // How many seconds remain before this window resets
        long resetSeconds = window.getSeconds() -
                Duration.between(entry.windowStart(), now).getSeconds();

        // Step 4: set headers so the client knows their rate limit status
        response.setHeader(HEADER_LIMIT, String.valueOf(limit));
        response.setHeader(HEADER_REMAINING, String.valueOf(remaining));
        response.setHeader(HEADER_RESET, String.valueOf(resetSeconds));

        // Step 5: reject if over limit
        if (current > limit) {
            // Retry-After tells the client how long to wait before retrying
            response.setHeader("Retry-After", String.valueOf(resetSeconds));
            httpErrorResponder.write(response, 429, "Too many requests");
            return; // stop here — do not continue the filter chain
        }

        // Step 6: under the limit — continue to the next filter (authentication)
        filterChain.doFilter(request, response);
    }
}