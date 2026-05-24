package com.claimo.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    /**
     * Registers ObjectMapper as a Spring bean so it can be injected anywhere.
     * Configured with:
     * - JavaTimeModule: handles Java 8 date/time types (Instant, LocalDate, etc.)
     * - WRITE_DATES_AS_TIMESTAMPS disabled: serializes dates as ISO-8601 strings
     *   instead of epoch numbers e.g. "2026-05-12T15:01:49Z" not 1747659709
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}