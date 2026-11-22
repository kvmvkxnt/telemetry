"use client";

import { useState } from "react";
import { api } from "@/lib/client/api";
import type { PublicRace, Racer, Result } from "@/lib/store";
import { translator, type Lang } from "@/lib/i18n";

type FieldState = {
  distance: string;
  elapsedTime: string;
  zeroToSixtyTime: string;
  zeroToHundredTime: string;
  hundredToTwoHundredTime: string;
  source: "manual" | "dragy";
  rawDragyPayload?: unknown;
};

function emptyFields(existing: Result | null): FieldState {
  return {
    distance: existing?.distance?.toString() ?? "",
    elapsedTime: existing?.elapsed_time?.toString() ?? "",
    zeroToSixtyTime: existing?.zero_to_60_time?.toString() ?? "",
    zeroToHundredTime: existing?.zero_to_100_time?.toString() ?? "",
    hundredToTwoHundredTime: existing?.hundred_to_200_time?.toString() ?? "",
    source: (existing?.source as "manual" | "dragy") ?? "manual",
  };
}

function toNumberOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function ResultForm({
  race,
  onDone,
  lang,
}: {
  race: PublicRace;
  onDone: () => void;
  lang: Lang;
}) {
  const t = translator(lang);
  const existingA = race.results.find((r) => r.racer_id === race.racerA.id) ?? null;
  const existingB = race.racerB ? race.results.find((r) => r.racer_id === race.racerB!.id) ?? null : null;

  const [fieldsA, setFieldsA] = useState<FieldState>(emptyFields(existingA));
  const [fieldsB, setFieldsB] = useState<FieldState>(emptyFields(existingB));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragyLoading, setDragyLoading] = useState<"A" | "B" | null>(null);

  async function pullDragy(who: "A" | "B", racer: Racer) {
    setDragyLoading(who);
    setError(null);
    try {
      const { session } = await api.pullDragy(`racer-${racer.id}`);
      if (!session) {
        setError(t("dragyNone"));
        return;
      }
      const next: FieldState = {
        distance: session.distance.toString(),
        elapsedTime: session.elapsedTime.toFixed(2),
        // Dragy has no 0-60 figure to offer — keep whatever was typed manually.
        zeroToSixtyTime: (who === "A" ? fieldsA : fieldsB).zeroToSixtyTime,
        zeroToHundredTime: session.zeroToHundredTime?.toFixed(2) ?? "",
        hundredToTwoHundredTime: session.hundredToTwoHundredTime?.toFixed(2) ?? "",
        source: "dragy",
        rawDragyPayload: session.raw,
      };
      if (who === "A") setFieldsA(next);
      else setFieldsB(next);
    } catch {
      setError(t("dragyFailed"));
    } finally {
      setDragyLoading(null);
    }
  }

  function validate(f: FieldState): string | null {
    const nums = [f.distance, f.elapsedTime, f.zeroToSixtyTime, f.zeroToHundredTime, f.hundredToTwoHundredTime];
    for (const v of nums) {
      if (v.trim() === "") continue;
      const n = Number(v);
      if (Number.isNaN(n) || n < 0) return t("nonNegative");
    }
    return null;
  }

  async function submit() {
    const errA = validate(fieldsA);
    const errB = race.racerB ? validate(fieldsB) : null;
    const validationError = errA ?? errB;
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const results = [
        {
          racerId: race.racerA.id,
          distance: toNumberOrNull(fieldsA.distance),
          elapsedTime: toNumberOrNull(fieldsA.elapsedTime),
          zeroToSixtyTime: toNumberOrNull(fieldsA.zeroToSixtyTime),
          zeroToHundredTime: toNumberOrNull(fieldsA.zeroToHundredTime),
          hundredToTwoHundredTime: toNumberOrNull(fieldsA.hundredToTwoHundredTime),
          source: fieldsA.source,
          rawDragyPayload: fieldsA.rawDragyPayload,
        },
      ];
      if (race.racerB) {
        results.push({
          racerId: race.racerB.id,
          distance: toNumberOrNull(fieldsB.distance),
          elapsedTime: toNumberOrNull(fieldsB.elapsedTime),
          zeroToSixtyTime: toNumberOrNull(fieldsB.zeroToSixtyTime),
          zeroToHundredTime: toNumberOrNull(fieldsB.zeroToHundredTime),
          hundredToTwoHundredTime: toNumberOrNull(fieldsB.hundredToTwoHundredTime),
          source: fieldsB.source,
          rawDragyPayload: fieldsB.rawDragyPayload,
        });
      }
      await api.submitResults(race.id, results);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
      <div className="mb-4 text-lg font-semibold text-white">
        {race.status === "completed" ? t("editResult") : t("enterResult")} — {race.racerA.brand} {race.racerA.model}
        {race.racerB ? ` vs ${race.racerB.brand} ${race.racerB.model}` : ""}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <RacerFields
          label={`${race.racerA.brand} ${race.racerA.model}`}
          fields={fieldsA}
          setFields={setFieldsA}
          onPullDragy={() => pullDragy("A", race.racerA)}
          pulling={dragyLoading === "A"}
          lang={lang}
        />
        {race.racerB && (
          <RacerFields
            label={`${race.racerB.brand} ${race.racerB.model}`}
            fields={fieldsB}
            setFields={setFieldsB}
            onPullDragy={() => pullDragy("B", race.racerB!)}
            pulling={dragyLoading === "B"}
            lang={lang}
          />
        )}
      </div>

      {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? t("publishing") : t("publishResult")}
        </button>
        <button onClick={onDone} className="rounded-lg px-5 py-2 font-semibold text-neutral-400 hover:text-white">
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

function RacerFields({
  label,
  fields,
  setFields,
  onPullDragy,
  pulling,
  lang,
}: {
  label: string;
  fields: FieldState;
  setFields: (f: FieldState) => void;
  onPullDragy: () => void;
  pulling: boolean;
  lang: Lang;
}) {
  const t = translator(lang);
  const set = (key: keyof FieldState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields({ ...fields, [key]: e.target.value, source: "manual" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">{label}</div>
        <button
          onClick={onPullDragy}
          disabled={pulling}
          className="rounded-md border border-neutral-600 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400 disabled:opacity-50"
        >
          {pulling ? t("pulling") : t("pullDragy")}
        </button>
      </div>
      {fields.source === "dragy" && (
        <div className="text-xs text-emerald-400">{t("dragyPrefilled")}</div>
      )}
      <LabeledInput label={t("distance")} value={fields.distance} onChange={set("distance")} />
      <LabeledInput label={t("elapsedTimeField")} value={fields.elapsedTime} onChange={set("elapsedTime")} />
      <LabeledInput label={t("zeroTo60Field")} value={fields.zeroToSixtyTime} onChange={set("zeroToSixtyTime")} />
      <LabeledInput label={t("zeroTo100Field")} value={fields.zeroToHundredTime} onChange={set("zeroToHundredTime")} />
      <LabeledInput
        label={t("hundredTo200Field")}
        value={fields.hundredToTwoHundredTime}
        onChange={set("hundredToTwoHundredTime")}
      />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block text-sm text-neutral-400">
      {label}
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
      />
    </label>
  );
}
