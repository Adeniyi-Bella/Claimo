package com.claimo.api.user.service;

import java.util.Optional;

import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.user.model.User;
import com.claimo.api.user.dto.UserProfileResponse;

public interface UserService {
    User createUser(String clerkUserId, String email, String firstName, String lastName);

    Optional<User> findByClerkUserId(String clerkUserId);

    boolean existsByClerkUserId(String clerkUserId);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    UserProfileResponse getProfile(Jwt jwt);
}
