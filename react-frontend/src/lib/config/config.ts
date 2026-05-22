function requireEnv(key: string, validator?: (v: string) => boolean): string {
  const value = import.meta.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Missing env var: ${key}`);
  }
  if (validator && !validator(value)) {
    throw new Error(`Invalid env var: ${key}`);
  }
  return value;
}

export const config = {
  VITE_API_URL: requireEnv("VITE_API_URL", v => v.startsWith("http")),
  VITE_CLERK_PUBLISHABLE_KEY: requireEnv("VITE_CLERK_PUBLISHABLE_KEY"),
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_ENV: requireEnv("VITE_ENV", v => ["development", "production"].includes(v)),
} as const;

export const isDevelopment = config.VITE_ENV === "development";
export const isProduction = config.VITE_ENV === "production";
