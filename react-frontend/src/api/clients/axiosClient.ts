import axios, { type AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "@/types/constants";
import {
  ApiError,
  NetworkError,
  ServerDownError,
  TimeoutError,
  UnauthorizedError,
} from "../error/customeError";
import type { CustomApiResponse } from "../dto/responseDto";

/**
 * Singleton Axios client for all API communication in the application.
 *
 * Responsibilities:
 * - Provides a single configured Axios instance shared across the app
 * - Normalizes all API errors into typed AppError subclasses so the rest
 *   of the app never needs to inspect raw Axios or HTTP error shapes
 * - Maps error categories: auth errors → UnauthorizedError, network issues
 *   → NetworkError/TimeoutError, server crashes → ServerDownError,
 *   and all other HTTP errors → ApiError
 */
export class AxiosApiClient {
  private static instance: AxiosInstance;

  /**
   * Returns the shared Axios instance, creating and configuring it on first call.
   * Subsequent calls return the same instance (singleton pattern).
   */
  static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = this.createInstance();
      this.setupInterceptors();
    }
    return this.instance;
  }

  /**
   * Creates a new Axios instance with base configuration.
   * - baseURL and timeout are pulled from constants to keep them configurable per environment
   * - ngrok header skips the browser warning page during local tunnel development
   */
  private static createInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT_MS,
    });
  }

  /**
   * Request interceptor: automatically attaches the Clerk session token to
   * every outgoing request. Centralizing this here removes the need for
   * every hook/API method to manually call getToken() and pass it through.
   *
   * If Clerk's getToken() throws (e.g. ERR_NETWORK_CHANGED), the error is
   * normalized into NetworkError so it flows through the same retry logic
   * as any other network failure, instead of bypassing it as a raw/unknown error.
   */
  private static setupInterceptors(): void {
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await window.Clerk?.session?.getToken();
          if (!token) {
            return Promise.reject(
              new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401),
            );
          }
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        } catch {
          return Promise.reject(new NetworkError());
        }
      },
      () => Promise.reject(new NetworkError()),
    );

    this.instance.interceptors.response.use(
      // Pass successful responses through unchanged
      (response) => response,
      (error: AxiosError<CustomApiResponse<unknown>>) => {
        if (error.response) {
          const { status, data } = error.response;

          // Prefer the structured error message from the response body;
          // fall back to a generic message if the body is malformed
          const message =
            data?.error?.message || "An unexpected error occurred";

          // Build a consistent error code from the response body or HTTP status
          const code = `HTTP_${data?.error?.status ?? status}`;
          // 401 — session expired or invalid token; handled globally via auth-error event
          if (status === 401)
            return Promise.reject(new UnauthorizedError(message, code, status));
          // All other 4xx/5xx responses
          return Promise.reject(new ApiError(message, code, status));
        }
        // 2. No Response (Internet is out or Server is totally crashed/timed out)
        if (error.code === "ECONNABORTED")
          return Promise.reject(new TimeoutError());
        if (error.code === "ERR_NETWORK")
          return Promise.reject(new NetworkError());

        return Promise.reject(new ServerDownError());
      },
    );
  }
}

export const apiClient = AxiosApiClient.getInstance();
