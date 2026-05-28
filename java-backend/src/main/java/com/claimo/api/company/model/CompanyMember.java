package com.claimo.api.company.model;

import java.time.Instant;
import java.util.UUID;

import com.claimo.api.company.enums.CompanyRole;
import com.claimo.api.user.model.User;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "company_members")
@Getter
@Setter
@NoArgsConstructor
public class CompanyMember {

    @EmbeddedId
    private CompanyMemberId id = new CompanyMemberId();

    @MapsId("companyId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyRole role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant createdAt;

    public UUID getCompanyId() {
        return id.getCompanyId();
    }

    public void setCompanyId(UUID companyId) {
        this.id.setCompanyId(companyId);
    }

    public UUID getUserId() {
        return id.getUserId();
    }

    public void setUserId(UUID userId) {
        this.id.setUserId(userId);
    }
}
