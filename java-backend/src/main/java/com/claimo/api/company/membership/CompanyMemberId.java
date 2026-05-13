package com.claimo.api.company.membership;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class CompanyMemberId implements Serializable {
    private UUID companyId;
    private UUID userId;

    public CompanyMemberId() {
    }

    public CompanyMemberId(UUID companyId, UUID userId) {
        this.companyId = companyId;
        this.userId = userId;
    }

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompanyMemberId that = (CompanyMemberId) o;
        return Objects.equals(companyId, that.companyId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(companyId, userId);
    }
}
