package com.claimo.api.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String REQUEST_ID_MDC_KEY = "requestId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        response.setHeader(REQUEST_ID_HEADER, requestId);

        long startNanos = System.nanoTime();
        MDC.put(REQUEST_ID_MDC_KEY, requestId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            int status = response.getStatus();
            String path = request.getRequestURI();
            String query = request.getQueryString();
            if (query != null && !query.isBlank()) {
                path = path + "?" + query;
            }

            String logMessage = String.format(
                    "request_completed method=%s path=%s status=%d durationMs=%d clientIp=%s",
                    request.getMethod(),
                    path,
                    status,
                    durationMs,
                    resolveClientIp(request));

            if (status >= 500) {
                log.error(logMessage);
            } else if (status >= 400) {
                log.warn(logMessage);
            } else {
                log.info(logMessage);
            }
            MDC.remove(REQUEST_ID_MDC_KEY);
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
