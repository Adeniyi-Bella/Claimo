package com.claimo.api.user;

import org.springframework.data.jpa.repository.JpaRepository;

import com.claimo.api.user.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByClerkUserId(String clerkUserId);

    boolean existsByClerkUserId(String clerkUserId);

    boolean existsByEmail(String email);
}
