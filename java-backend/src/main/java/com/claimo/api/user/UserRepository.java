package com.claimo.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.claimo.api.user.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByClerkUserId(String clerkUserId);

    boolean existsByClerkUserId(String clerkUserId);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    @Modifying
    @Query(value = """
            WITH deleted_company_invites AS (
                DELETE FROM company_invites
                WHERE email = :email
            ),
            deleted_pending_invites AS (
                DELETE FROM pending_invites
                WHERE email = :email
            )
            DELETE FROM users
            WHERE clerk_user_id = :clerkUserId
            """, nativeQuery = true)
    int deleteAllUserDataByClerkUserIdAndEmail(
            @Param("clerkUserId") String clerkUserId,
            @Param("email") String email);
}
