const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(message, { status = 0, code = "unknown", requestId = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export async function request(
  path,
  { method = "GET", body, token, signal } = {}
) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Cannot reach the server. Please try again.", {
      code: "network_error",
    });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const e = data?.error;
    throw new ApiError(e?.message ?? "Request failed.", {
      status: response.status,
      code: e?.code ?? "request_failed",
      requestId: e?.request_id ?? null,
    });
  }
  return data;
}

export const api = {
  health: (signal) => request("/health", { signal }),
};