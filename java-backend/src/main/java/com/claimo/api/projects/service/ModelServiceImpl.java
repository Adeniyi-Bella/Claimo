package com.claimo.api.projects.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.claimo.api.auth.AuthHelper;
import com.claimo.api.exceptions.AppExceptions;
import com.claimo.api.projects.dto.ModelDto;
import com.claimo.api.projects.models.Project;
import com.claimo.api.projects.models.ProjectModel;
import com.claimo.api.projects.repository.ProjectModelRepository;
import com.claimo.api.projects.repository.ProjectRepository;
import com.claimo.api.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModelServiceImpl implements ModelService {

    private final BlobContainerClient blobContainerClient;
    private final ProjectRepository projectRepository;
    private final ProjectModelRepository projectModelRepository;
    private final AuthHelper authHelper;

    @Override
    @Transactional
    public ModelDto uploadModel(Jwt jwt, UUID projectId, UUID modelId, String fileName, MultipartFile file) {
        User user = authHelper.getAuthenticatedUser(jwt);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Project not found: " + projectId));

        String storagePath = "projects/" + projectId + "/models/" + modelId + "/" + fileName;

        BlobClient blobClient = blobContainerClient.getBlobClient(storagePath);

        try {
            blobClient.upload(file.getInputStream(), file.getSize(), true);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Azure Blob Storage", e);
        }

        String fileUrl = blobClient.getBlobUrl();

        ProjectModel model = new ProjectModel();
        model.setId(modelId);
        model.setProject(project);
        model.setFileName(fileName);
        model.setFileUrl(fileUrl);
        model.setStoragePath(storagePath);
        model.setUploadedBy(user);
        model.setUploadedAt(Instant.now());

        ProjectModel saved = projectModelRepository.save(model);

        log.info("Model uploaded modelId={} projectId={}", modelId, projectId);

        return new ModelDto(
                saved.getId(),
                saved.getFileName(),
                "ifc",
                saved.getFileUrl(),
                saved.getUploadedAt(),
                user.getFirstName() + " " + user.getLastName(),
                List.of());
    }

    @Override
    @Transactional
    public void deleteModel(Jwt jwt, UUID projectId, UUID modelId) {
        User user = authHelper.getAuthenticatedUser(jwt);

        ProjectModel model = projectModelRepository.findById(modelId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Model not found: " + modelId));

        if (!model.getProject().getId().equals(projectId)) {
            throw new AppExceptions.ForbiddenException("Model does not belong to project: " + projectId);
        }

        BlobClient blobClient = blobContainerClient.getBlobClient(model.getStoragePath());
        if (blobClient.exists()) {
            blobClient.delete();
        }

        projectModelRepository.delete(model);
        log.info("Model deleted modelId={} projectId={} deletedBy={}", modelId, projectId, user.getId());
    }

    @Override
    public byte[] downloadModel(Jwt jwt, UUID projectId, UUID modelId) {
        User user = authHelper.getAuthenticatedUser(jwt);

        ProjectModel model = projectModelRepository.findById(modelId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Model not found: " + modelId));

        if (!model.getProject().getId().equals(projectId)) {
            throw new AppExceptions.ForbiddenException("Model does not belong to project: " + projectId);
        }

        BlobClient blobClient = blobContainerClient.getBlobClient(model.getStoragePath());

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            blobClient.downloadStream(outputStream);
            log.info("Model downloaded modelId={} projectId={} userId={}", modelId, projectId, user.getId());
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to download model from Azure", e);
        }
    }
}