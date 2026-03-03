/**
 * Shared epoch utility functions.
 */

export const DEFAULT_FOUNDATION_PCT = 20;
export const DEFAULT_RECKONING_PCT = 15;

interface EpochConfig {
  duration_days: number;
  cycle_hours: number;
  foundation_pct?: number;
  reckoning_pct?: number;
}

/** Compute the total number of cycles for an epoch config. */
export function computeTotalCycles(config: EpochConfig): number {
  return Math.floor((config.duration_days * 24) / config.cycle_hours);
}

/** Compute the cycle count for each phase. */
export function computePhaseCycles(config: EpochConfig): {
  foundation: number;
  competition: number;
  reckoning: number;
} {
  const total = computeTotalCycles(config);
  if (total === 0) return { foundation: 0, competition: 0, reckoning: 0 };
  const foundationPct = config.foundation_pct ?? DEFAULT_FOUNDATION_PCT;
  const reckoningPct = config.reckoning_pct ?? DEFAULT_RECKONING_PCT;
  const foundation = Math.round(total * (foundationPct / 100));
  const reckoning = Math.round(total * (reckoningPct / 100));
  const competition = total - foundation - reckoning;
  return { foundation, competition, reckoning };
}
