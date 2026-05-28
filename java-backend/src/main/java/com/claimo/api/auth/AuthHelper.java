package com.claimo.api.auth;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.user.model.User;
import com.claimo.api.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthHelper {

    private final UserService userService;

    public User getAuthenticatedUser(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        return userService.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));
    }
}
