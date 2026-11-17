import { AppError } from "@/lib/errors";

const WINDOW_MS = 60_000;
const BUDGET = 45;
const RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1000;

let requestTimes: number[] = [];
let blockedUntil = 0;

function pruneTimes(now: number) {
  requestTimes = requestTimes.filter((time) => now - time < WINDOW_MS);
}

export function assertUpstreamAvailable() {
  const now = Date.now();
  if (now < blockedUntil) {
    throw new AppError("rate_limited", {
      retryAfter: Math.ceil((blockedUntil - now) / 1000),
    });
  }
}

export function takeUpstreamSlot() {
  assertUpstreamAvailable();
  const now = Date.now();
  pruneTimes(now);

  if (requestTimes.length >= BUDGET) {
    throw new AppError("budget");
  }

  requestTimes.push(now);
}

export function tripCircuitBreaker() {
  blockedUntil = Math.max(blockedUntil, Date.now() + RATE_LIMIT_COOLDOWN_MS);
}

export function upstreamState(): {
  used: number;
  budget: number;
  blockedForSeconds: number;
} {
  const now = Date.now();
  pruneTimes(now);
  return {
    used: requestTimes.length,
    budget: BUDGET,
    blockedForSeconds: Math.max(0, Math.ceil((blockedUntil - now) / 1000)),
  };
}

export function resetUpstreamStateForTests() {
  requestTimes = [];
  blockedUntil = 0;
}
