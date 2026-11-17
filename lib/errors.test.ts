import { describe, expect, it } from "vitest";

import { AppError, isAppError, publicError } from "@/lib/errors";

describe("AppError", () => {
  it("maps error codes to HTTP statuses", () => {
    expect(new AppError("invalid_input").status).toBe(400);
    expect(new AppError("not_found").status).toBe(404);
    expect(new AppError("member_not_found").status).toBe(404);
    expect(new AppError("rate_limited").status).toBe(503);
    expect(new AppError("config").status).toBe(503);
    expect(new AppError("upstream").status).toBe(502);
    expect(new AppError("timeout").status).toBe(504);
  });

  it("keeps retryAfter metadata", () => {
    const error = new AppError("rate_limited", { retryAfter: 3600 });
    expect(error.retryAfter).toBe(3600);
  });

  it("recognises itself", () => {
    expect(isAppError(new AppError("timeout"))).toBe(true);
    expect(isAppError(new Error("nope"))).toBe(false);
  });
});

describe("publicError", () => {
  it("never leaks arbitrary error messages", () => {
    const details = publicError(new Error("secret internal detail"));
    expect(details.code).toBe("upstream");
    expect(details.message).not.toContain("secret");
    expect(details.status).toBe(502);
  });

  it("passes through AppError details", () => {
    const details = publicError(
      new AppError("member_not_found", { retryAfter: 5 })
    );
    expect(details).toMatchObject({
      code: "member_not_found",
      status: 404,
      retryAfter: 5,
    });
  });
});
