package com.claimo.api.config;

import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.exceptions.ErrorMessageResolver;
// import com.claimo.api.redis.RedisService;
// import com.claimo.api.security.JwtBlacklistValidator;
import com.claimo.api.shared.config.properties.AppSecurityProperties;

import org.apache.catalina.filters.RateLimitFilter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
        private final AppSecurityProperties appSecurityProperties;
        private final RateLimitFilter rateLimitFilter;
        // private final RedisService redisService;
        private final HandlerExceptionResolver exceptionResolver;
        private final ErrorMessageResolver errorMessageResolver;

        public SecurityConfig(
                        AppSecurityProperties appSecurityProperties,
                        RateLimitFilter rateLimitFilter,
                        // RedisService redisService,
                        @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver,
                        ErrorMessageResolver errorMessageResolver) {
                this.appSecurityProperties = appSecurityProperties;
                this.rateLimitFilter = rateLimitFilter;
                // this.redisService = redisService;
                this.exceptionResolver = exceptionResolver;
                this.errorMessageResolver = errorMessageResolver;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                return http
                                // Tells Spring Security never to create or use HTTP sessions. Every request
                                // must carry its own JWT token — no server-side session state.
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                // Disable CSRF since we're a stateless API and not using cookies for auth.
                                .csrf(AbstractHttpConfigurer::disable)
                                // Enable CORS with our custom configuration (corsConfigurationSource).
                                .cors(Customizer.withDefaults())
                                // Add our custom rate limiting filter before the authentication filter so that
                                // we can reject requests that exceed limits without even attempting
                                // authentication.
                                .addFilterBefore(rateLimitFilter, BearerTokenAuthenticationFilter.class)
                                // Customises what happens when authentication fails or access is denied
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(
                                                                (request, response, authException) -> exceptionResolver
                                                                                .resolveException(request,
                                                                                                response, null,
                                                                                                new AppExceptions.UnauthorizedException(
                                                                                                                errorMessageResolver
                                                                                                                                .resolve(
                                                                                                                                                authException.getMessage(),
                                                                                                                                                "Authentication failed"))))
                                                .accessDeniedHandler((request, response,
                                                                accessException) -> exceptionResolver.resolveException(
                                                                                request, response, null,
                                                                                new AppExceptions.ForbiddenException(
                                                                                                errorMessageResolver
                                                                                                                .resolve(
                                                                                                                                accessException.getMessage(),
                                                                                                                                "Access denied")))))
                                // Configure authorization rules: public endpoints are permitted to all,
                                // everything else requires authentication.
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                appSecurityProperties.publicEndpoints()
                                                                                .toArray(String[]::new))
                                                .permitAll()
                                                .anyRequest().authenticated())
                                // Configure the app as an OAuth2 Resource Server that uses JWT tokens for
                                // authentication.
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .jwt(Customizer.withDefaults())
                                                .authenticationEntryPoint(
                                                                (request, response, authException) -> exceptionResolver
                                                                                .resolveException(
                                                                                                request, response, null,
                                                                                                new AppExceptions.UnauthorizedException(
                                                                                                                errorMessageResolver
                                                                                                                                .resolve(
                                                                                                                                                authException.getMessage(),
                                                                                                                                                "Authentication failed")))))
                                .build();
        }

        @Bean
        public JwtDecoder jwtDecoder() {
                String issuerUri = appSecurityProperties.issuerUri();
                // Fetches the public keys from the identity provider's well-known JWKS endpoint
                // automatically using the issuer URI.
                JwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuerUri);

                OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
                // OAuth2TokenValidator<Jwt> withAudience = new
                // AudienceValidator(appSecurityProperties.audience());
                // OAuth2TokenValidator<Jwt> withBlacklist = new
                // JwtBlacklistValidator(redisService);
                OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                                withIssuer
                // withAudience
                // withBlacklist
                );

                if (decoder instanceof NimbusJwtDecoder nimbus) {
                        nimbus.setJwtValidator(validator);
                        return nimbus;
                }
                throw new IllegalStateException(
                                "Unsupported JwtDecoder type — expected NimbusJwtDecoder but got: "
                                                + decoder.getClass().getName());
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                // Billing checkout allows Idempotency-Key header
                // CorsConfiguration checkoutConfig = new CorsConfiguration();
                // checkoutConfig.setAllowedOrigins(appSecurityProperties.allowedOrigins());
                // checkoutConfig.setAllowedMethods(List.of("POST"));
                // checkoutConfig.setAllowedHeaders(List.of(
                //                 "Authorization",
                //                 "Content-Type",
                //                 "X-Requested-With",
                //                 "Idempotency-Key"));
                // checkoutConfig.setAllowCredentials(true);
                // checkoutConfig.setExposedHeaders(List.of(
                //                 "X-RateLimit-Limit",
                //                 "X-RateLimit-Remaining",
                //                 "X-RateLimit-Reset"));

                // Default config no Idempotency-Key
                CorsConfiguration defaultConfig = new CorsConfiguration();
                defaultConfig.setAllowedOrigins(appSecurityProperties.allowedOrigins());
                defaultConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
                defaultConfig.setAllowedHeaders(List.of(
                                "Authorization",
                                "Content-Type",
                                "X-Requested-With"));
                defaultConfig.setAllowCredentials(true);
                defaultConfig.setExposedHeaders(List.of(
                                "X-RateLimit-Limit",
                                "X-RateLimit-Remaining",
                                "X-RateLimit-Reset"));

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                // source.registerCorsConfiguration("/api/v1/billing/checkout", checkoutConfig);
                source.registerCorsConfiguration("/**", defaultConfig);

                return source;
        }
}
