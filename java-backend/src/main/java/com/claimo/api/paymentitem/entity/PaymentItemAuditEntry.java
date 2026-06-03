package com.claimo.api.paymentitem.entity;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.projects.enums.AuditField;
import com.claimo.api.projects.enums.ProjectRole;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_item_audit_entries")
@Getter
@Setter
@NoArgsConstructor
public class PaymentItemAuditEntry {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_item_id", nullable = false)
    private PaymentItem paymentItem;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "actor_id", nullable = false)
    private String actorId;

    @Column(name = "actor_name", nullable = false)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", nullable = false)
    private ProjectRole actorRole;

    @Column(nullable = false)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditField field;

    @Column(name = "from_value")
    private String fromValue;

    @Column(name = "to_value")
    private String toValue;
}
