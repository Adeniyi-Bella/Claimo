package com.claimo.api.projects.controller;

import com.claimo.api.exceptions.CustomApiResponse;
import com.claimo.api.projects.dto.ModelDto;
import com.claimo.api.projects.service.ModelService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/models")
@RequiredArgsConstructor
@Tag(name = "Models", description = "Project model management")
public class ModelController {

        private final ModelService modelService;

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @Operation(summary = "Upload a model", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Model uploaded successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "404", description = "Project not found")
        })
        public ResponseEntity<CustomApiResponse<ModelDto>> uploadModel(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @RequestParam UUID modelId,
                        @RequestParam String fileName,
                        @RequestParam MultipartFile file) {
                ModelDto response = modelService.uploadModel(jwt, projectId, modelId, fileName, file);
                return ResponseEntity.status(HttpStatus.CREATED).body(CustomApiResponse.success(response));
        }

        @DeleteMapping("/{modelId}")
        @Operation(summary = "Delete a model", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Model deleted successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "404", description = "Model not found")
        })
        public ResponseEntity<Void> deleteModel(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID modelId) {
                modelService.deleteModel(jwt, projectId, modelId);
                return ResponseEntity.noContent().build();
        }

        @GetMapping("/{modelId}/download")
        @Operation(summary = "Download model file", security = @SecurityRequirement(name = "bearerAuth"))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Model downloaded successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "404", description = "Model not found")
        })
        public ResponseEntity<byte[]> downloadModel(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable UUID projectId,
                        @PathVariable UUID modelId) {
                byte[] bytes = modelService.downloadModel(jwt, projectId, modelId);
                return ResponseEntity.ok()
                                .header("Content-Type", "application/octet-stream")
                                .header("Content-Disposition", "attachment; filename=\"model.ifc\"")
                                .body(bytes);
        }
}