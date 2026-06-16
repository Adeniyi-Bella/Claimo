import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse, ProjectModel } from "@/api/dto/responseDto";

export class ModelApi {
  static async uploadModel(
    // token: string,
    projectId: string,
    modelId: string,
    fileName: string,
    file: File,
  ): Promise<ProjectModel> {
    const formData = new FormData();
    formData.append("modelId", modelId);
    formData.append("fileName", fileName);
    formData.append("file", file);

    const response = await apiClient.post<CustomApiResponse<ProjectModel>>(
      `/projects/${projectId}/models`,
      formData,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return requireApiData(response.data, {
      message: "Upload model response missing data",
      code: "EMPTY_UPLOAD_MODEL_RESPONSE",
      statusCode: response.status,
    });
  }

  static async deleteModel(
    // token: string,
    projectId: string,
    modelId: string,
  ): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/models/${modelId}`, {
      // headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async downloadModel(
    // token: string,
    projectId: string,
    modelId: string,
  ): Promise<ArrayBuffer> {
    const response = await apiClient.get(
      `/projects/${projectId}/models/${modelId}/download`,
      {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
        responseType: "arraybuffer",
      },
    );
    return response.data;
  }
}
