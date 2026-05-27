import type { CustomApiResponse } from "./dto/responseDto";
import { ApiError } from "./error/customeError";

type RequireApiDataOptions = {
  message: string;
  code: string;
  statusCode?: number;
};

export function requireApiData<T>(
  response: CustomApiResponse<T>,
  options: RequireApiDataOptions,
): NonNullable<T> {
  if (response.data === undefined || response.data === null) {
    throw new ApiError(
      options.message,
      options.code,
      options.statusCode ?? 502,
    );
  }

  return response.data as NonNullable<T>;
}

export function requireApiSuccess(
  response: CustomApiResponse<unknown>,
  options: RequireApiDataOptions,
): void {
  if (!response.success) {
    throw new ApiError(
      options.message,
      options.code,
      options.statusCode ?? 502,
    );
  }
}