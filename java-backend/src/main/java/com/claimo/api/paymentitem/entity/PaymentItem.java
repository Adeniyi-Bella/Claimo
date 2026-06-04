package com.claimo.api.paymentitem.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import com.claimo.api.projects.enums.JobStatus;
import com.claimo.api.projects.enums.PaymentItemCategory;
import com.claimo.api.projects.enums.PaymentStatus;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectModel;
import com.claimo.api.user.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_items")
@Getter
@Setter
@NoArgsConstructor
public class PaymentItem {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id", nullable = false)
    private ProjectModel model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentItemCategory category;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "contractor_id")
    private User contractor;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "contract_value", nullable = false, precision = 18, scale = 2)
    private BigDecimal contractValue;

    @Column
    private String description;

    @Column(name = "created_at", updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant updatedAt;

    @OneToMany(mappedBy = "paymentItem", orphanRemoval = true)
    private Set<PaymentItemClaim> claims = new LinkedHashSet<>();

    @Column(name = "attached_element_ids")
    private String attachedElementIdsJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_status", nullable = false)
    private JobStatus jobStatus = JobStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.NONE;

    @Column(name = "payment_confirmation_pending", nullable = false)
    private boolean paymentConfirmationPending;

    @OneToMany(mappedBy = "paymentItem", orphanRemoval = true)
    private Set<PaymentItemAuditEntry> auditTrail = new LinkedHashSet<>();
}
