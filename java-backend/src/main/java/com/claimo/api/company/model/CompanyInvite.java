package com.claimo.api.company.model;

import com.claimo.api.company.enums.CompanyInviteStatus;
import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.user.model.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "company_invites")
@Getter
@Setter
@NoArgsConstructor
public class CompanyInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(name = "clerk_invitation_id", unique = true)
    private String clerkInvitationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CompanyRole role;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CompanyInviteStatus status = CompanyInviteStatus.PENDING;

    @Column(name = "accepted_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant acceptedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", nullable = false)
    private User invitedBy;

    @CreationTimestamp
    @Column(updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant createdAt;
}
