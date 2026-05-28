package com.claimo.api.user.service;

import java.util.List;
import java.util.Optional;

import com.claimo.api.company.model.Company;
import com.claimo.api.company.model.CompanyMember;
import com.claimo.api.company.repository.CompanyMemberRepository;
import com.claimo.api.exceptions.AppExceptions.ResourceNotFoundException;
import com.claimo.api.user.UserRepository;
import com.claimo.api.user.dto.UserProfileResponse;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
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
        User user = new User();
        user.setClerkUserId(clerkUserId);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        return userRepository.save(user);
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
}
