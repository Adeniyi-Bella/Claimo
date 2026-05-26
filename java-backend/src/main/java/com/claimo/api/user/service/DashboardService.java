package com.claimo.api.user.service;

import org.springframework.security.oauth2.jwt.Jwt;

import com.claimo.api.user.dto.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboard(Jwt jwt);
}
