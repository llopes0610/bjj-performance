import Link from "next/link";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Clock3,
  History,
  Minus,
  Ruler,
  Timer,
  Weight,
} from "lucide-react";

type ProgressionDecision =
  | "PROGRESS"
  | "MAINTAIN"
  | "REGRESS"
  | "NO_DATA";

type ExerciseExecutionType =
  | "REPS"
  | "TIME"
  | "DISTANCE";

interface ExerciseCardProps {
  workoutExerciseId: string;

  order: number;
  name: string;

  block: string;

  executionType?: ExerciseExecutionType;

  sets: number;

  repsMin?: number | null;
  repsMax?: number | null;

  durationSeconds?: number | null;
  distanceMeters?: number | null;

  restSeconds: number;

  targetRpe?: number | null;

  progressionDecision?:
    | ProgressionDecision
    | null;

  suggestedWeightKg?: number | null;

  previousAverageWeightKg?: number | null;
  previousAverageReps?: number | null;
  previousAverageRpe?: number | null;

  previousAverageDurationSeconds?: number | null;
  previousAverageDistanceMeters?: number | null;
}

function formatPrescription({
  sets,
  repsMin,
  repsMax,
  durationSeconds,
  distanceMeters,
}: Pick<
  ExerciseCardProps,
  | "sets"
  | "repsMin"
  | "repsMax"
  | "durationSeconds"
  | "distanceMeters"
>) {
  if (
    repsMin !== null &&
    repsMin !== undefined &&
    repsMax !== null &&
    repsMax !== undefined
  ) {
    return `${sets} × ${repsMin}–${repsMax}`;
  }

  if (
    durationSeconds !== null &&
    durationSeconds !== undefined
  ) {
    return `${sets} × ${durationSeconds}s`;
  }

  if (
    distanceMeters !== null &&
    distanceMeters !== undefined
  ) {
    return `${sets} × ${distanceMeters}m`;
  }

  return `${sets} séries`;
}

function formatNumber(
  value: number | null | undefined,
  decimals = 1
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        decimals,
    }
  ).format(value);
}

function hasValue(
  value:
    | number
    | null
    | undefined
) {
  return (
    value !== null &&
    value !== undefined
  );
}

function getProgressionDescription(
  decision: ProgressionDecision,
  executionType: ExerciseExecutionType
) {
  if (decision === "NO_DATA") {
    return "Ainda não existem dados suficientes para progressão.";
  }

  if (
    executionType === "TIME"
  ) {
    if (
      decision === "PROGRESS"
    ) {
      return "O tempo anterior foi cumprido com esforço controlado. A duração foi aumentada.";
    }

    if (
      decision === "REGRESS"
    ) {
      return "O esforço ficou acima do planejado. A duração foi ajustada para favorecer uma execução adequada.";
    }

    return "Mantenha a duração prescrita e consolide o desempenho.";
  }

  if (
    executionType ===
    "DISTANCE"
  ) {
    if (
      decision === "PROGRESS"
    ) {
      return "A distância foi cumprida com esforço controlado. A carga pode progredir.";
    }

    if (
      decision === "REGRESS"
    ) {
      return "A distância ou o esforço indicou necessidade de ajustar a carga.";
    }

    return "Mantenha a distância e a carga para consolidar o desempenho.";
  }

  if (
    decision === "PROGRESS"
  ) {
    return "Desempenho anterior permite aumentar a carga.";
  }

  if (
    decision === "REGRESS"
  ) {
    return "Reduza a carga para recuperar a faixa prescrita.";
  }

  return "Mantenha a carga e consolide o desempenho.";
}

const blockLabels: Record<
  string,
  string
> = {
  ACTIVATION: "Ativação",
  MAIN: "Principal",
  ACCESSORY: "Acessório",
  CORE: "Core",
  GRIP: "Pegada",
  CONDITIONING:
    "Condicionamento",
  MOBILITY: "Mobilidade",
};

const progressionConfig = {
  PROGRESS: {
    label: "Progressão",

    className:
      "border-green-500/20 bg-green-500/5 text-green-400",

    Icon: ArrowUp,
  },

  MAINTAIN: {
    label: "Manter",

    className:
      "border-blue-500/20 bg-blue-500/5 text-blue-400",

    Icon: ArrowRight,
  },

  REGRESS: {
    label: "Ajuste",

    className:
      "border-amber-500/20 bg-amber-500/5 text-amber-400",

    Icon: ArrowDown,
  },

  NO_DATA: {
    label: "Sem histórico",

    className:
      "border-zinc-700 bg-zinc-800/40 text-zinc-400",

    Icon: Minus,
  },
} satisfies Record<
  ProgressionDecision,
  {
    label: string;
    className: string;
    Icon: typeof ArrowUp;
  }
>;

export function ExerciseCard({
  workoutExerciseId,
  order,
  name,
  block,
  executionType = "REPS",
  sets,
  repsMin,
  repsMax,
  durationSeconds,
  distanceMeters,
  restSeconds,
  targetRpe,
  progressionDecision,
  suggestedWeightKg,
  previousAverageWeightKg,
  previousAverageReps,
  previousAverageRpe,
  previousAverageDurationSeconds,
  previousAverageDistanceMeters,
}: ExerciseCardProps) {
  const prescription =
    formatPrescription({
      sets,
      repsMin,
      repsMax,
      durationSeconds,
      distanceMeters,
    });

  const decision =
    progressionDecision ??
    "NO_DATA";

  const progression =
    progressionConfig[
      decision
    ];

  const ProgressionIcon =
    progression.Icon;

  const progressionDescription =
    getProgressionDescription(
      decision,
      executionType
    );

  const formattedSuggestedWeight =
    formatNumber(
      suggestedWeightKg,
      1
    );

  const formattedPreviousWeight =
    formatNumber(
      previousAverageWeightKg,
      1
    );

  const formattedPreviousReps =
    formatNumber(
      previousAverageReps,
      1
    );

  const formattedPreviousRpe =
    formatNumber(
      previousAverageRpe,
      1
    );

  const formattedPreviousDuration =
    formatNumber(
      previousAverageDurationSeconds,
      1
    );

  const formattedPreviousDistance =
    formatNumber(
      previousAverageDistanceMeters,
      1
    );

  const hasPreviousData =
    hasValue(
      previousAverageWeightKg
    ) ||
    hasValue(
      previousAverageReps
    ) ||
    hasValue(
      previousAverageRpe
    ) ||
    hasValue(
      previousAverageDurationSeconds
    ) ||
    hasValue(
      previousAverageDistanceMeters
    );

  return (
    <Link
      href={`/workout/exercise/${workoutExerciseId}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 transition active:bg-zinc-900 sm:p-4 sm:hover:border-zinc-700 sm:hover:bg-zinc-900">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* ORDEM */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300 sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">
            {String(order).padStart(
              2,
              "0"
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* CABEÇALHO */}
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-start gap-1.5 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:gap-2">
                  <h3 className="max-w-full break-words text-sm font-semibold leading-5 text-white sm:text-base sm:font-medium">
                    {name}
                  </h3>

                  <span className="max-w-full rounded-full bg-zinc-800 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-400 sm:text-[10px]">
                    {blockLabels[
                      block
                    ] ?? block}
                  </span>
                </div>

                {/* PRESCRIÇÃO */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-400 sm:gap-x-4 sm:text-sm">
                  <span className="font-medium text-zinc-300">
                    {prescription}
                  </span>

                  {targetRpe !== null &&
                    targetRpe !==
                      undefined && (
                      <span>
                        RPE{" "}
                        {targetRpe}
                      </span>
                    )}

                  <span className="flex items-center gap-1">
                    <Clock3
                      size={13}
                      aria-hidden="true"
                    />

                    {restSeconds}s
                  </span>
                </div>
              </div>

              <ChevronRight
                size={19}
                aria-hidden="true"
                className="mt-1 shrink-0 text-zinc-600 transition group-hover:text-red-500 sm:group-hover:translate-x-1"
              />
            </div>

            {/* PROGRESSÃO */}
            <div
              className={[
                "mt-3 rounded-xl border p-3 sm:mt-4",
                progression.className,
              ].join(" ")}
            >
              <div className="flex flex-col gap-2.5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-3">
                <div className="flex items-center gap-2">
                  <ProgressionIcon
                    size={16}
                    aria-hidden="true"
                  />

                  <span className="text-[11px] font-bold uppercase tracking-wider sm:text-xs">
                    {
                      progression.label
                    }
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {executionType ===
                    "TIME" &&
                    durationSeconds !==
                      null &&
                    durationSeconds !==
                      undefined && (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        <Timer
                          size={15}
                          aria-hidden="true"
                        />

                        {
                          durationSeconds
                        }
                        s
                      </div>
                    )}

                  {executionType ===
                    "DISTANCE" &&
                    distanceMeters !==
                      null &&
                    distanceMeters !==
                      undefined && (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        <Ruler
                          size={15}
                          aria-hidden="true"
                        />

                        {
                          distanceMeters
                        }
                        m
                      </div>
                    )}

                  {formattedSuggestedWeight !==
                    null && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                      <Weight
                        size={15}
                        aria-hidden="true"
                      />

                      {
                        formattedSuggestedWeight
                      }{" "}
                      kg
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-zinc-400 sm:text-xs">
                {
                  progressionDescription
                }
              </p>
            </div>

            {/* HISTÓRICO */}
            {hasPreviousData && (
              <div className="mt-3 rounded-lg bg-black/10 px-2.5 py-2.5 sm:bg-transparent sm:px-0 sm:py-0">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 sm:mb-0 sm:inline-flex sm:text-xs">
                  <History
                    size={13}
                    aria-hidden="true"
                  />

                  Semana anterior
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-zinc-500 sm:ml-4 sm:inline-flex sm:gap-x-4 sm:text-xs">
                  {formattedPreviousWeight !==
                    null && (
                    <span>
                      {
                        formattedPreviousWeight
                      }{" "}
                      kg
                    </span>
                  )}

                  {formattedPreviousReps !==
                    null && (
                    <span>
                      {
                        formattedPreviousReps
                      }{" "}
                      reps
                    </span>
                  )}

                  {formattedPreviousDuration !==
                    null && (
                    <span className="flex items-center gap-1">
                      <Timer
                        size={12}
                        aria-hidden="true"
                      />

                      {
                        formattedPreviousDuration
                      }
                      s
                    </span>
                  )}

                  {formattedPreviousDistance !==
                    null && (
                    <span className="flex items-center gap-1">
                      <Ruler
                        size={12}
                        aria-hidden="true"
                      />

                      {
                        formattedPreviousDistance
                      }
                      m
                    </span>
                  )}

                  {formattedPreviousRpe !==
                    null && (
                    <span>
                      RPE{" "}
                      {
                        formattedPreviousRpe
                      }
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}