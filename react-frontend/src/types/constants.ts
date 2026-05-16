import { config } from "@/lib/config/config";

export const API_BASE_URL = config.VITE_API_URL;
export const API_TIMEOUT_MS = 15000;
export const AUTH_SESSION_INVALIDATE_EVENT = "admina:auth-error";
