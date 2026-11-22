export type WinnerMetric = "elapsed_time" | "zero_to_60_time" | "zero_to_100_time";

export const WINNER_METRICS: WinnerMetric[] = ["elapsed_time", "zero_to_60_time", "zero_to_100_time"];

export type RacerResult = {
  racer_id: number;
  elapsed_time: number | null;
  zero_to_60_time: number | null;
  zero_to_100_time: number | null;
};

/** Every metric is a time: lower wins. Null/missing values never win. */
export function determineWinner(
  results: RacerResult[],
  metric: WinnerMetric
): number | null {
  const valid = results.filter((r) => r[metric] != null);
  if (valid.length === 0) return null;

  const best = valid.reduce((a, b) => ((b[metric] as number) < (a[metric] as number) ? b : a));
  return best.racer_id;
}
