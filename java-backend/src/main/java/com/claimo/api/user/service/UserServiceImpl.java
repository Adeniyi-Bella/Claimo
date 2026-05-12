package com.claimo.api.user.service;

import com.claimo.api.company.CompanyRepository;
import com.claimo.api.company.dto.CompanyDto;
import lombok.RequiredArgsConstructor;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.exceptions.AppExceptions.ResourceNotFoundException;
import com.claimo.api.user.UserRepository;
import com.claimo.api.user.enums.UserRole;
import com.claimo.api.user.dto.UserDto;
import com.claimo.api.user.dto.httpResponse.UserProfileResponse;
import com.claimo.api.user.model.User;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public UserDto createUser(String clerkUserId, CompanyDto company, UserRole role) {
        UUID companyId = company.id();
        if (companyId == null) {
            throw new AppExceptions.BadRequestException("Company id is required to create a user");
        }

        User user = new User();
        user.setClerkUserId(clerkUserId);
        user.setCompany(companyRepository.getReferenceById(companyId));
        user.setRole(role);
        return UserDto.fromEntity(userRepository.save(user));
    }

    @Override
    public UserProfileResponse getProfile(Jwt jwt) {
        // Extract Clerk user ID from the JWT subject claim
        String clerkUserId = jwt.getSubject();

        User user = userRepository.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));

        return new UserProfileResponse(
                user.getId(),
                user.getClerkUserId(),
                user.getRole().name(),
                user.getCompany().getId(),
                user.getCompany().getName(),
                user.getCreatedAt());
    }

    @Override
    public Optional<UserDto> findByClerkUserId(String clerkUserId) {
        return userRepository.findByClerkUserId(clerkUserId).map(UserDto::fromEntity);
    }

    @Override
    public boolean existsByClerkUserId(String clerkUserId) {
        return userRepository.existsByClerkUserId(clerkUserId);
    }
}
