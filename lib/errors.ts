export type AppErrorCode =
  | "invalid_input"
  | "not_found"
  | "member_not_found"
  | "weekly_unavailable"
  | "rate_limited"
  | "config"
  | "upstream"
  | "budget"
  | "timeout";

const STATUS: Record<AppErrorCode, number> = {
  invalid_input: 400,
  not_found: 404,
  member_not_found: 404,
  weekly_unavailable: 404,
  rate_limited: 503,
  config: 503,
  upstream: 502,
  budget: 503,
  timeout: 504,
};

const PUBLIC_MESSAGE: Record<AppErrorCode, string> = {
  invalid_input:
    "That doesn't look like a Discord server ID or invite link. Check the value and try again.",
  not_found:
    "We couldn't find that server in Amari. Make sure Amari is in the server and the ID is correct.",
  member_not_found:
    "We couldn't find that player in this server. Check the Discord user ID and try again.",
  weekly_unavailable:
    "Weekly leaderboards aren't available for this server. It may be disabled, or the server may not be tracked yet.",
  rate_limited:
    "Amari is rate-limiting requests right now. We'll show cached data when we can.",
  config:
    "The leaderboard service isn't configured on this deployment. Please try again later.",
  upstream: "Amari isn't responding right now. Please try again in a moment.",
  budget:
    "We're handling a lot of requests right now. Please try again in a moment.",
  timeout: "Amari took too long to respond. Please try again.",
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly retryAfter?: number;
  readonly cause?: unknown;

  constructor(
    code: AppErrorCode,
    options?: { message?: string; retryAfter?: number; cause?: unknown }
  ) {
    super(options?.message ?? PUBLIC_MESSAGE[code]);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.retryAfter = options?.retryAfter;
    this.cause = options?.cause;
  }
}

export function publicError(error: unknown): {
  code: AppErrorCode;
  message: string;
  status: number;
  retryAfter?: number;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      retryAfter: error.retryAfter,
    };
  }

  return {
    code: "upstream",
    message: PUBLIC_MESSAGE.upstream,
    status: 502,
  };
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
