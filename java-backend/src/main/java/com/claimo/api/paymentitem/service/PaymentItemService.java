package com.claimo.api.paymentitem.service;

import com.claimo.api.paymentitem.dto.PaymentItemResponseDto;
import com.claimo.api.paymentitem.dto.request.AssignPaymentItemRequest;
import com.claimo.api.paymentitem.dto.request.ConfirmPaymentRequest;
import com.claimo.api.paymentitem.dto.request.CreatePaymentItemRequest;
import com.claimo.api.paymentitem.dto.request.DecideClaimRequest;
import com.claimo.api.paymentitem.dto.request.SubmitClaimRequest;
import com.claimo.api.paymentitem.dto.request.UpdateJobStatusRequest;
import com.claimo.api.paymentitem.dto.request.UpdatePaymentStatusRequest;

import org.springframework.security.oauth2.jwt.Jwt;
import java.util.UUID;

public interface PaymentItemService {
        PaymentItemResponseDto createPaymentItem(
                        Jwt jwt,
                        UUID projectId,
                        CreatePaymentItemRequest request);

        PaymentItemResponseDto getPaymentItemById(Jwt jwt, UUID projectId, UUID itemId);

        PaymentItemResponseDto submitClaim(Jwt jwt, UUID projectId, UUID itemId, SubmitClaimRequest request);

        PaymentItemResponseDto decideClaim(Jwt jwt, UUID projectId, UUID itemId, UUID claimId,
                        DecideClaimRequest request);

        PaymentItemResponseDto updateJobStatus(Jwt jwt, UUID projectId, UUID itemId, UpdateJobStatusRequest request);

        PaymentItemResponseDto updatePaymentStatus(Jwt jwt, UUID projectId, UUID itemId,
                        UpdatePaymentStatusRequest request);

        PaymentItemResponseDto confirmPayment(Jwt jwt, UUID projectId, UUID itemId, ConfirmPaymentRequest request);

        PaymentItemResponseDto assignPaymentItem(Jwt jwt, UUID projectId, UUID itemId,
                        AssignPaymentItemRequest request);

}
