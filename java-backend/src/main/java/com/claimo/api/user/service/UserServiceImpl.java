package com.claimo.api.user.service;

import java.util.List;
import java.util.Optional;
import java.util.Locale;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.model.CompanyMember;
import com.claimo.api.company.repository.CompanyMemberRepository;
import com.claimo.api.exceptions.AppExceptions.ResourceNotFoundException;
import com.claimo.api.user.UserRepository;
import com.claimo.api.user.dto.UserProfileResponse;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CompanyMemberRepository companyMemberRepository;

    @Override
    @Transactional
    public User createUser(String clerkUserId, String email, String firstName, String lastName) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT).trim();

        Optional<User> existingByClerkUserId = userRepository.findByClerkUserId(clerkUserId);
        if (existingByClerkUserId.isPresent()) {
            User existing = existingByClerkUserId.get();
            updateUserFields(existing, clerkUserId, normalizedEmail, firstName, lastName);
            return userRepository.save(existing);
        }

        Optional<User> existingByEmail = userRepository.findByEmail(normalizedEmail);
        if (existingByEmail.isPresent()) {
            User existing = existingByEmail.get();
            updateUserFields(existing, clerkUserId, normalizedEmail, firstName, lastName);
            return userRepository.save(existing);
        }

        User user = new User();
        updateUserFields(user, clerkUserId, normalizedEmail, firstName, lastName);

        try {
            return userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            return userRepository.findByClerkUserId(clerkUserId)
                    .or(() -> userRepository.findByEmail(normalizedEmail))
                    .orElseThrow(() -> ex);
        }
    }

    @Override
    public UserProfileResponse getProfile(Jwt jwt) {
        String clerkUserId = jwt.getSubject();

        User user = userRepository.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found for clerkUserId: " + clerkUserId));

        List<UserProfileResponse.CompanyMembershipResponse> companies = companyMemberRepository
                .findAllByUser_Id(user.getId())
                .stream()
                .map(this::toCompanyMembershipResponse)
                .toList();

        return new UserProfileResponse(
                user.getId(),
                user.getClerkUserId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getCreatedAt(),
                companies);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public Optional<User> findByClerkUserId(String clerkUserId) {
        return userRepository.findByClerkUserId(clerkUserId);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public void deleteAllUserDataByClerkUserIdAndEmail(String clerkUserId, String email) {
        userRepository.deleteAllUserDataByClerkUserIdAndEmail(clerkUserId, email);
    }

    @Override
    public boolean existsByClerkUserId(String clerkUserId) {
        return userRepository.existsByClerkUserId(clerkUserId);
    }

    private UserProfileResponse.CompanyMembershipResponse toCompanyMembershipResponse(CompanyMember member) {
        Company company = member.getCompany();
        return new UserProfileResponse.CompanyMembershipResponse(
                company.getId(),
                company.getName(),
                member.getRole().name());
    }

    private void updateUserFields(User user, String clerkUserId, String email, String firstName, String lastName) {
        user.setClerkUserId(clerkUserId);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
    }
}
