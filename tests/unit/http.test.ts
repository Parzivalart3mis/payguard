import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, withErrorHandling } from "@/lib/http";

describe("withErrorHandling", () => {
  it("passes through a successful response", async () => {
    const handler = withErrorHandling(async () =>
      NextResponse.json({ ok: true }),
    );
    const res = await handler();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("maps ApiError to the shared error shape and status", async () => {
    const handler = withErrorHandling(async () => {
      throw new ApiError("not_found", "nope");
    });
    const res = await handler();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "not_found", message: "nope" },
    });
  });

  it("maps a ZodError to a 400 bad_request", async () => {
    const schema = z.object({ name: z.string() });
    const handler = withErrorHandling(async () => {
      schema.parse({ name: 123 });
      return NextResponse.json({});
    });
    const res = await handler();
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("bad_request");
  });

  it("maps unknown errors to a 500 internal", async () => {
    const handler = withErrorHandling(async () => {
      throw new Error("boom");
    });
    const res = await handler();
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("internal");
  });
});
