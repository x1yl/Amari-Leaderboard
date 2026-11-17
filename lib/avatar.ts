function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function avatarGradient(seed: string): {
  from: string;
  to: string;
  foreground: string;
} {
  const hash = hashString(seed);
  const h1 = hash % 360;
  const h2 = (h1 + 38 + ((hash >>> 9) % 44)) % 360;
  return {
    from: `hsl(${h1} 62% 42%)`,
    to: `hsl(${h2} 72% 30%)`,
    foreground: "rgba(255,255,255,0.92)",
  };
}
