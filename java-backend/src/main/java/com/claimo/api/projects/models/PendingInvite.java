package com.claimo.api.projects.models;

import com.claimo.api.company.model.Company;
import com.claimo.api.projects.enums.ProjectRole;
import com.claimo.api.projects.enums.PendingInviteStatus;
import com.claimo.api.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pending_invites")
@Getter
@Setter
@NoArgsConstructor
public class PendingInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(name = "clerk_invitation_id", unique = true)
    private String clerkInvitationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProjectRole role;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PendingInviteStatus status = PendingInviteStatus.PENDING;

    @Column(name = "accepted_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant acceptedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", nullable = false)
    private User invitedBy;

    @CreationTimestamp
    @Column(updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant createdAt;
}
