package com.claimo.api.user.service;

import java.util.Optional;

import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.company.dto.CompanyDto;
import com.claimo.api.user.enums.UserRole;
import com.claimo.api.user.dto.UserDto;
import com.claimo.api.user.dto.httpResponse.UserProfileResponse;

public interface UserService {
    UserDto createUser(String clerkUserId, CompanyDto company, UserRole role);

    Optional<UserDto> findByClerkUserId(String clerkUserId);

    boolean existsByClerkUserId(String clerkUserId);

    UserProfileResponse getProfile(Jwt jwt);
}
