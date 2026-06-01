package com.claimo.api.projects.service;

import com.claimo.api.projects.dto.PaymentItemResponseDto;
import com.claimo.api.projects.dto.requests.CreatePaymentItemRequest;

import org.springframework.security.oauth2.jwt.Jwt;
import java.util.UUID;

public interface PaymentItemService {
    PaymentItemResponseDto createPaymentItem(
            Jwt jwt,
            UUID projectId,
            CreatePaymentItemRequest request);
}