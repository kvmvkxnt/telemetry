export type WinnerMetric = "elapsed_time" | "top_speed";

export type RacerResult = {
  racer_id: number;
  elapsed_time: number | null;
  top_speed: number | null;
};

/** Lower elapsed_time wins; higher top_speed wins. Null/missing values never win. */
export function determineWinner(
  results: RacerResult[],
  metric: WinnerMetric
): number | null {
  const valid = results.filter((r) =>
    metric === "elapsed_time" ? r.elapsed_time != null : r.top_speed != null
  );
  if (valid.length === 0) return null;

  const best = valid.reduce((a, b) => {
    if (metric === "elapsed_time") {
      return (b.elapsed_time as number) < (a.elapsed_time as number) ? b : a;
    }
    return (b.top_speed as number) > (a.top_speed as number) ? b : a;
  });
  return best.racer_id;
}
