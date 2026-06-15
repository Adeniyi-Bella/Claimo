package com.claimo.api.paymentitem.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.claimo.api.paymentitem.entity.PaymentItem;
import com.claimo.api.projects.dto.IProjectFinancials;
import com.claimo.api.projects.enums.PaymentItemCategory;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentItemRepository extends JpaRepository<PaymentItem, UUID> {

        @EntityGraph(attributePaths = {
                        "project",
                        "model",
                        "contractor",
                        "approver",
                        "claims",
                        "auditTrail"
        })
        List<PaymentItem> findAllByProject_IdIn(List<UUID> projectIds);

        boolean existsByModel_IdAndCategory(UUID modelId, PaymentItemCategory category);

        @EntityGraph(attributePaths = {
                        "project",
                        "model",
                        "contractor",
                        "approver",
                        "claims",
                        "auditTrail"
        })
        Optional<PaymentItem> findWithDetailsById(UUID id);

        @Query("""
                        SELECT
                            pi.project.id          AS projectId,
                            SUM(pi.contractValue)  AS contractValue,
                            SUM(CASE WHEN c.status = 'APPROVED' THEN c.amount ELSE 0 END) AS approved,
                            SUM(CASE WHEN c.status = 'SUBMITTED' THEN c.amount ELSE 0 END) AS submitted,
                            SUM(CASE WHEN c.status = 'REJECTED' THEN c.amount ELSE 0 END) AS rejected
                        FROM PaymentItem pi
                        LEFT JOIN pi.claims c
                        WHERE pi.project.id IN :projectIds
                        GROUP BY pi.project.id
                        """)
        List<IProjectFinancials> findFinancialsByProjectIds(@Param("projectIds") List<UUID> projectIds);
}
