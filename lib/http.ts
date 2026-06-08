import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Shared error shape returned by every API route: { error: { code, message } }. */
export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "payload_too_large"
  | "unsupported_media_type"
  | "internal";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  payload_too_large: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  internal: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status: STATUS_BY_CODE[code] },
  );
}

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Wrap a route handler so thrown ApiError / ZodError / unknown errors are
 * mapped to the shared error shape. Keeps handlers focused on the happy path.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.code, err.message);
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const path = first?.path.join(".") ?? "";
        const message = first
          ? `${path ? `${path}: ` : ""}${first.message}`
          : "Invalid request body.";
        return errorResponse("bad_request", message);
      }
      console.error("Unhandled route error:", err);
      return errorResponse("internal", "Something went wrong.");
    }
  };
}
