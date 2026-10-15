"use client";

import { useState } from "react";

import {
  Check,
  LoaderCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";

export type ExerciseExecutionType =
  | "REPS"
  | "TIME"
  | "DISTANCE";

interface WorkoutSetRowProps {
  setId: string;
  setNumber: number;

  executionType: ExerciseExecutionType;

  initialWeightKg?: number | null;
  initialReps?: number | null;

  initialDurationSeconds?: number | null;
  initialDistanceMeters?: number | null;

  initialRpe?: number | null;

  completed: boolean;

  targetRpe?: number | null;

  prescribedDurationSeconds?: number | null;
  prescribedDistanceMeters?: number | null;
}

export function WorkoutSetRow({
  setId,
  setNumber,
  executionType,
  initialWeightKg,
  initialReps,
  initialDurationSeconds,
  initialDistanceMeters,
  initialRpe,
  completed,
  targetRpe,
  prescribedDurationSeconds,
  prescribedDistanceMeters,
}: WorkoutSetRowProps) {
  const router = useRouter();

  const [weightKg, setWeightKg] =
    useState(
      initialWeightKg !== null &&
        initialWeightKg !== undefined
        ? String(initialWeightKg)
        : ""
    );

  const [reps, setReps] =
    useState(
      initialReps !== null &&
        initialReps !== undefined
        ? String(initialReps)
        : ""
    );

  const [
    durationSeconds,
    setDurationSeconds,
  ] = useState(
    initialDurationSeconds !== null &&
      initialDurationSeconds !== undefined
      ? String(initialDurationSeconds)
      : prescribedDurationSeconds !== null &&
          prescribedDurationSeconds !== undefined
        ? String(
            prescribedDurationSeconds
          )
        : ""
  );

  const [
    distanceMeters,
    setDistanceMeters,
  ] = useState(
    initialDistanceMeters !== null &&
      initialDistanceMeters !== undefined
      ? String(initialDistanceMeters)
      : prescribedDistanceMeters !== null &&
          prescribedDistanceMeters !== undefined
        ? String(
            prescribedDistanceMeters
          )
        : ""
  );

  const [rpe, setRpe] =
    useState(
      initialRpe !== null &&
        initialRpe !== undefined
        ? String(initialRpe)
        : targetRpe !== null &&
            targetRpe !== undefined
          ? String(targetRpe)
          : ""
    );

  const [
    isCompleted,
    setIsCompleted,
  ] = useState(completed);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleComplete() {
    if (
      loading ||
      isCompleted
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      /*
       * Enviamos somente os campos
       * pertinentes ao tipo de execução.
       *
       * O backend continua sendo a
       * autoridade final para validar
       * o executionType.
       */
      const payload: {
        setId: string;
        rpe: string;

        weightKg?: string;
        reps?: string;

        durationSeconds?: string;
        distanceMeters?: string;
      } = {
        setId,
        rpe,
      };

      if (
        executionType === "REPS"
      ) {
        payload.weightKg =
          weightKg;

        payload.reps =
          reps;
      }

      if (
        executionType === "TIME"
      ) {
        payload.weightKg =
          weightKg;

        payload.durationSeconds =
          durationSeconds;
      }

      if (
        executionType ===
        "DISTANCE"
      ) {
        payload.weightKg =
          weightKg;

        payload.distanceMeters =
          distanceMeters;
      }

      const response =
        await fetch(
          "/api/workout/set/complete",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Não foi possível registrar a série."
        );
      }

      setIsCompleted(true);

      /*
       * Atualiza o Server Component.
       *
       * Isso permite atualizar:
       *
       * - contador de séries;
       * - exercício concluído;
       * - finalização do treino.
       */
      router.refresh();
    } catch (error) {
      console.error(
        "COMPLETE_SET_CLIENT_ERROR",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a série."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={[
        "rounded-2xl border p-4 transition sm:rounded-xl",
        isCompleted
          ? "border-green-500/20 bg-green-500/5"
          : "border-zinc-800 bg-zinc-950/60",
      ].join(" ")}
    >
      {/* CABEÇALHO */}
      <div className="mb-4 flex min-h-7 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={[
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              isCompleted
                ? "bg-green-500/10 text-green-400"
                : "bg-zinc-800 text-zinc-300",
            ].join(" ")}
          >
            {setNumber}
          </span>

          <span className="text-sm font-semibold">
            Série {setNumber}
          </span>
        </div>

        {isCompleted && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
            <Check
              size={14}
              aria-hidden="true"
            />

            Concluída
          </span>
        )}
      </div>

      {/* REPETIÇÕES */}
      {executionType ===
        "REPS" && (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          <Field
            label="Carga"
            value={weightKg}
            onChange={
              setWeightKg
            }
            suffix="kg"
            step="0.5"
            disabled={
              isCompleted
            }
          />

          <Field
            label="Repetições"
            shortLabel="Reps"
            value={reps}
            onChange={setReps}
            step="1"
            disabled={
              isCompleted
            }
          />

          <Field
            label="RPE"
            value={rpe}
            onChange={setRpe}
            step="0.5"
            disabled={
              isCompleted
            }
          />
        </div>
      )}

      {/* TEMPO */}
      {executionType ===
        "TIME" && (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          <Field
            label="Carga"
            value={weightKg}
            onChange={
              setWeightKg
            }
            suffix="kg"
            step="0.5"
            disabled={
              isCompleted
            }
          />

          <Field
            label="Tempo"
            value={
              durationSeconds
            }
            onChange={
              setDurationSeconds
            }
            suffix="s"
            step="1"
            disabled={
              isCompleted
            }
          />

          <Field
            label="RPE"
            value={rpe}
            onChange={setRpe}
            step="0.5"
            disabled={
              isCompleted
            }
          />
        </div>
      )}

      {/* DISTÂNCIA */}
      {executionType ===
        "DISTANCE" && (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          <Field
            label="Carga"
            value={weightKg}
            onChange={
              setWeightKg
            }
            suffix="kg"
            step="0.5"
            disabled={
              isCompleted
            }
          />

          <Field
            label="Distância"
            value={
              distanceMeters
            }
            onChange={
              setDistanceMeters
            }
            suffix="m"
            step="0.5"
            disabled={
              isCompleted
            }
          />

          <Field
            label="RPE"
            value={rpe}
            onChange={setRpe}
            step="0.5"
            disabled={
              isCompleted
            }
          />
        </div>
      )}

      {!isCompleted && (
        <button
          type="button"
          onClick={
            handleComplete
          }
          disabled={loading}
          className="mt-4 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
                aria-hidden="true"
              />

              Salvando...
            </>
          ) : (
            <>
              <Check
                size={18}
                aria-hidden="true"
              />

              Concluir série
            </>
          )}
        </button>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;

  shortLabel?: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  suffix?: string;

  step: string;

  disabled: boolean;
}

function Field({
  label,
  shortLabel,
  value,
  onChange,
  suffix,
  step,
  disabled,
}: FieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-medium text-zinc-500">
        {shortLabel ? (
          <>
            <span className="min-[420px]:hidden">
              {label}
            </span>

            <span className="hidden min-[420px]:inline">
              {shortLabel}
            </span>
          </>
        ) : (
          label
        )}
      </span>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          disabled={
            disabled
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          className={[
            "h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-center text-base font-bold text-white outline-none transition",
            suffix
              ? "pr-9"
              : "",
            "focus:border-red-500 focus:ring-1 focus:ring-red-500/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-600">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}