const numberFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(Math.max(0, Math.trunc(value)));
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return compactFormatter.format(Math.max(0, Math.trunc(value)));
}

export function formatRelativeTime(timestamp: number): string {
  const delta = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(delta / 1000);

  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatInitials(name: string): string {
  const cleaned = name
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/[^\p{L}\p{N} _.·-]/gu, "")
    .trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s_.·-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${Array.from(parts[0])[0] ?? ""}${Array.from(parts[1])[0] ?? ""}`.toUpperCase();
  }
  const chars = Array.from(cleaned);
  return chars.slice(0, 2).join("").toUpperCase();
}
