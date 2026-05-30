package com.claimo.api.projects.service;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.multipart.MultipartFile;

import com.claimo.api.projects.dto.ModelDto;

import java.util.UUID;

public interface ModelService {
    ModelDto uploadModel(Jwt jwt, UUID projectId, UUID modelId, String fileName, MultipartFile file);

    void deleteModel(Jwt jwt, UUID projectId, UUID modelId);

    byte[] downloadModel(Jwt jwt, UUID projectId, UUID modelId);
}