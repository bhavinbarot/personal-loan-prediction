const DEFAULT_API_BASE_URL = "http://localhost:8000";

/**
 * Resolve the API origin.
 *
 * - In the browser only NEXT_PUBLIC_API_BASE_URL is available (inlined at build time).
 * - On the server API_BASE_URL takes precedence so deployments can target an internal
 *   address while the browser uses the public one.
 */
export function getApiBaseUrl(): string {
  const serverUrl = typeof window === "undefined" ? process.env.API_BASE_URL : undefined;
  const url = serverUrl || process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
  return url.replace(/\/+$/, "");
}
