"use client";

import { useState } from "react";

import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  LoaderCircle,
  Smile,
} from "lucide-react";

export type PostWorkoutFeeling =
  | "VERY_GOOD"
  | "GOOD"
  | "NORMAL"
  | "TIRED"
  | "VERY_TIRED";

export interface PostWorkoutFeedbackData {
  sessionRpe: number;
  postWorkoutFeeling: PostWorkoutFeeling;
  hasPain: boolean;
  painRegion: string | null;
  painIntensity: number | null;
  painNotes: string | null;
}

interface PostWorkoutFeedbackProps {
  loading?: boolean;

  onSubmit: (
    data: PostWorkoutFeedbackData
  ) => void | Promise<void>;
}

const feelings: Array<{
  value: PostWorkoutFeeling;
  label: string;
  shortLabel: string;
}> = [
  {
    value: "VERY_GOOD",
    label: "Muito bem",
    shortLabel: "Ótimo",
  },
  {
    value: "GOOD",
    label: "Bem",
    shortLabel: "Bem",
  },
  {
    value: "NORMAL",
    label: "Normal",
    shortLabel: "Normal",
  },
  {
    value: "TIRED",
    label: "Cansado",
    shortLabel: "Cansado",
  },
  {
    value: "VERY_TIRED",
    label: "Muito cansado",
    shortLabel: "Exausto",
  },
];

const painRegions = [
  "Pescoço",
  "Ombro",
  "Braço",
  "Cotovelo",
  "Antebraço",
  "Punho / Mão",
  "Peito",
  "Costas",
  "Lombar",
  "Abdômen / Core",
  "Quadril",
  "Virilha",
  "Coxa",
  "Joelho",
  "Canela",
  "Tornozelo",
  "Pé",
  "Outro",
];

export function PostWorkoutFeedback({
  loading = false,
  onSubmit,
}: PostWorkoutFeedbackProps) {
  const [sessionRpe, setSessionRpe] =
    useState(7);

  const [
    postWorkoutFeeling,
    setPostWorkoutFeeling,
  ] =
    useState<PostWorkoutFeeling>(
      "NORMAL"
    );

  const [hasPain, setHasPain] =
    useState(false);

  const [painRegion, setPainRegion] =
    useState("");

  const [
    painIntensity,
    setPainIntensity,
  ] = useState(3);

  const [painNotes, setPainNotes] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit() {
    if (loading) {
      return;
    }

    if (
      sessionRpe < 1 ||
      sessionRpe > 10
    ) {
      setError(
        "Informe um esforço geral entre 1 e 10."
      );

      return;
    }

    if (
      hasPain &&
      !painRegion.trim()
    ) {
      setError(
        "Informe onde você sentiu dor."
      );

      return;
    }

    if (
      hasPain &&
      (painIntensity < 1 ||
        painIntensity > 10)
    ) {
      setError(
        "Informe a intensidade da dor entre 1 e 10."
      );

      return;
    }

    setError(null);

    await onSubmit({
      sessionRpe,

      postWorkoutFeeling,

      hasPain,

      painRegion: hasPain
        ? painRegion.trim()
        : null,

      painIntensity: hasPain
        ? painIntensity
        : null,

      painNotes:
        hasPain &&
        painNotes.trim()
          ? painNotes.trim()
          : null,
    });
  }

  return (
    <div className="w-full">
      {/* CABEÇALHO */}
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
          <Check
            size={24}
            aria-hidden="true"
          />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-green-400">
          Séries concluídas
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Como foi o treino?
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          Essas informações ajudam a
          ajustar sua progressão e a
          controlar a carga dos próximos
          treinos.
        </p>
      </div>

      <div className="mt-7 space-y-5 sm:mt-8">
        {/* SESSION RPE */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Activity
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-white">
                Esforço geral
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Considere o treino inteiro,
                não apenas a última série.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <span className="text-xs font-medium text-zinc-500">
              Muito leve
            </span>

            <div className="text-center">
              <span className="text-3xl font-bold tabular-nums text-white">
                {sessionRpe}
              </span>

              <span className="ml-1 text-sm text-zinc-500">
                / 10
              </span>
            </div>

            <span className="text-xs font-medium text-zinc-500">
              Máximo
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={sessionRpe}
            onChange={(event) =>
              setSessionRpe(
                Number(
                  event.target.value
                )
              )
            }
            aria-label="Esforço geral do treino"
            className="mt-4 h-2 w-full cursor-pointer accent-red-600"
          />

          <div className="mt-2 flex justify-between px-0.5 text-[10px] text-zinc-600">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </section>

        {/* SENSAÇÃO */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Smile
                size={18}
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Como você se sente?
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Pense na sua recuperação
                imediatamente após o treino.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {feelings.map(
              (feeling) => {
                const selected =
                  postWorkoutFeeling ===
                  feeling.value;

                return (
                  <button
                    key={
                      feeling.value
                    }
                    type="button"
                    onClick={() =>
                      setPostWorkoutFeeling(
                        feeling.value
                      )
                    }
                    aria-pressed={
                      selected
                    }
                    className={[
                      "min-h-12 rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
                      selected
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="sm:hidden">
                      {
                        feeling.label
                      }
                    </span>

                    <span className="hidden sm:inline">
                      {
                        feeling.shortLabel
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* DOR */}
        <section
          className={[
            "rounded-2xl border p-4 transition sm:p-5",
            hasPain
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-zinc-800 bg-zinc-950/60",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                hasPain
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-zinc-800 text-zinc-400",
              ].join(" ")}
            >
              <AlertTriangle
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-white">
                Sentiu dor durante o
                treino?
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Considere dor ou desconforto
                diferente do esforço muscular
                esperado.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setHasPain(false);
                setError(null);
              }}
              aria-pressed={
                !hasPain
              }
              className={[
                "min-h-12 rounded-xl border px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
                !hasPain
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              Não
            </button>

            <button
              type="button"
              onClick={() => {
                setHasPain(true);
                setError(null);
              }}
              aria-pressed={
                hasPain
              }
              className={[
                "min-h-12 rounded-xl border px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
                hasPain
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400",
              ].join(" ")}
            >
              Sim
            </button>
          </div>

          {hasPain && (
            <div className="mt-5 space-y-5 border-t border-amber-500/10 pt-5">
              {/* REGIÃO */}
              <div>
                <label
                  htmlFor="pain-region"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Onde?
                </label>

                <select
                  id="pain-region"
                  value={painRegion}
                  onChange={(
                    event
                  ) =>
                    setPainRegion(
                      event.target
                        .value
                    )
                  }
                  className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 text-base text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                >
                  <option value="">
                    Selecione a região
                  </option>

                  {painRegions.map(
                    (region) => (
                      <option
                        key={region}
                        value={region}
                      >
                        {region}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* INTENSIDADE */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="pain-intensity"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Intensidade
                  </label>

                  <div>
                    <span className="text-xl font-bold tabular-nums text-amber-400">
                      {
                        painIntensity
                      }
                    </span>

                    <span className="ml-1 text-xs text-zinc-500">
                      / 10
                    </span>
                  </div>
                </div>

                <input
                  id="pain-intensity"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={
                    painIntensity
                  }
                  onChange={(
                    event
                  ) =>
                    setPainIntensity(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="mt-3 h-2 w-full cursor-pointer accent-amber-500"
                />

                <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
                  <span>Leve</span>
                  <span>Intensa</span>
                </div>
              </div>

              {/* OBSERVAÇÃO */}
              <div>
                <label
                  htmlFor="pain-notes"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Observação{" "}
                  <span className="font-normal text-zinc-600">
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="pain-notes"
                  rows={3}
                  maxLength={500}
                  value={painNotes}
                  onChange={(
                    event
                  ) =>
                    setPainNotes(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex.: desconforto no ombro durante a puxada..."
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-3 text-base leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                />

                <p className="mt-1.5 text-right text-[10px] text-zinc-600">
                  {painNotes.length}
                  /500
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-sm leading-5 text-red-300"
        >
          {error}
        </div>
      )}

      {/* FINALIZAÇÃO */}
      <div className="mt-6 border-t border-zinc-800 pt-5 sm:mt-8 sm:pt-6">
        <button
          type="button"
          onClick={
            handleSubmit
          }
          disabled={loading}
          className="flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-bold text-white transition active:scale-[0.99] hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
                aria-hidden="true"
              />

              Finalizando...
            </>
          ) : (
            <>
              Finalizar treino

              <ChevronRight
                size={19}
                aria-hidden="true"
              />
            </>
          )}
        </button>

        <p className="mt-3 text-center text-[11px] leading-5 text-zinc-600">
          Seu feedback será utilizado para
          melhorar as próximas prescrições.
        </p>
      </div>
    </div>
  );
}