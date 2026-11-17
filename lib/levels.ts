/**
 * Amari's published level table uses these total-EXP thresholds:
 *   level 1  -> 35
 *   level L  -> 20 * (L - 1)^2 + 35   (L >= 2)
 *
 * We clamp progress so unusual/reset rows can never render a negative bar.
 */
export function totalExpForLevel(level: number): number {
  if (!Number.isFinite(level) || level <= 0) return 0;
  if (level === 1) return 35;
  return 20 * Math.pow(level - 1, 2) + 35;
}

export function expToNextLevel(level: number): number {
  return Math.max(0, totalExpForLevel(level + 1) - totalExpForLevel(level));
}

export interface LevelProgress {
  percent: number;
  remaining: number;
  currentLevelExp: number;
  nextLevelExp: number;
  span: number;
}

export function getLevelProgress(exp: number, level: number): LevelProgress {
  const currentLevelExp = totalExpForLevel(level);
  const nextLevelExp = totalExpForLevel(level + 1);
  const span = Math.max(1, nextLevelExp - currentLevelExp);

  const safeExp = Number.isFinite(exp) ? exp : currentLevelExp;
  const within = Math.min(span, Math.max(0, safeExp - currentLevelExp));

  return {
    percent: (within / span) * 100,
    remaining: Math.max(0, nextLevelExp - safeExp),
    currentLevelExp,
    nextLevelExp,
    span,
  };
}
