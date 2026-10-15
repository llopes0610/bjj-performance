import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Gauge,
  HeartPulse,
  Layers3,
  MapPin,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface HistorySessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function HistorySessionPage({
  params,
}: HistorySessionPageProps) {
  /*
   * ========================================
   * AUTENTICAÇÃO
   * ========================================
   */

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { sessionId } =
    await params;

  /*
   * ========================================
   * SESSÃO
   * ========================================
   *
   * A consulta também valida propriedade:
   * somente o atleta dono da sessão pode
   * visualizar este histórico.
   */

  const workoutSession =
    await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        status: "COMPLETED",

        athlete: {
          user: {
            email:
              session.user.email,
          },
        },
      },

      include: {
        workout: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                phase: true,
                durationWeeks: true,
              },
            },
          },
        },

        exercises: {
          orderBy: {
            order: "asc",
          },

          include: {
            workoutExercise: {
              include: {
                exercise: true,
              },
            },

            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
        },
      },
    });

  if (!workoutSession) {
    notFound();
  }

  /*
   * ========================================
   * RESUMO
   * ========================================
   */

  const completedAt =
    workoutSession.completedAt ??
    workoutSession.startedAt;

  const completedSets =
    workoutSession.exercises.flatMap(
      (exercise) =>
        exercise.sets.filter(
          (set) => set.completed
        )
    );

  const totalVolumeKg =
    completedSets.reduce(
      (total, set) => {
        if (
          set.weightKg === null ||
          set.reps === null
        ) {
          return total;
        }

        return (
          total +
          set.weightKg *
            set.reps
        );
      },
      0
    );

  const setsWithRpe =
    completedSets.filter(
      (set) => set.rpe !== null
    );

  const averageSetRpe =
    setsWithRpe.length > 0
      ? setsWithRpe.reduce(
          (total, set) =>
            total +
            (set.rpe ?? 0),
          0
        ) / setsWithRpe.length
      : null;

  const completedExercises =
    workoutSession.exercises.filter(
      (exercise) =>
        exercise.completed
    ).length;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:py-10 sm:pb-28 lg:pb-12">
        {/* ================================= */}
        {/* VOLTAR */}
        {/* ================================= */}

        <Link
          href="/history"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={18} />

          Histórico
        </Link>

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header className="mt-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Dumbbell size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Treino{" "}
                {
                  workoutSession
                    .workout.code
                }
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {
                  workoutSession
                    .workout.name
                }
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted">
                {
                  workoutSession
                    .workout.program.name
                }
                {" • "}
                Semana{" "}
                {
                  workoutSession.programWeek
                }
                {" de "}
                {
                  workoutSession
                    .workout.program
                    .durationWeeks
                }
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1.5 text-xs font-semibold text-green-400 sm:flex">
              <CheckCircle2
                size={15}
              />

              Concluído
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* INFORMAÇÕES DA SESSÃO */}
        {/* ================================= */}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            icon={
              <CalendarDays
                size={18}
              />
            }
            value={formatDate(
              completedAt
            )}
            label="Data"
          />

          <MetricCard
            icon={
              <Clock3
                size={18}
              />
            }
            value={
              workoutSession.durationMinutes !==
              null
                ? `${workoutSession.durationMinutes} min`
                : "—"
            }
            label="Duração"
          />

          <MetricCard
            icon={
              <Gauge
                size={18}
              />
            }
            value={
              workoutSession.sessionRpe !==
              null
                ? `${workoutSession.sessionRpe}/10`
                : "—"
            }
            label="RPE da sessão"
          />

          <MetricCard
            icon={
              <Layers3
                size={18}
              />
            }
            value={`${completedSets.length}`}
            label="Séries concluídas"
          />
        </section>

        {/* ================================= */}
        {/* PERFORMANCE */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <SectionHeader
            icon={
              <Activity size={21} />
            }
            eyebrow="Performance"
            title="Resumo do treino"
          />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InformationCard
              label="Exercícios"
              value={`${completedExercises}/${workoutSession.exercises.length}`}
            />

            <InformationCard
              label="Volume"
              value={
                totalVolumeKg > 0
                  ? formatWeight(
                      totalVolumeKg
                    )
                  : "—"
              }
            />

            <InformationCard
              label="RPE médio séries"
              value={
                averageSetRpe !==
                null
                  ? averageSetRpe.toFixed(
                      1
                    )
                  : "—"
              }
            />

            <InformationCard
              label="Fase"
              value={formatPhase(
                workoutSession
                  .workout.program.phase
              )}
            />
          </div>
        </section>

        {/* ================================= */}
        {/* FEEDBACK */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <SectionHeader
            icon={
              <HeartPulse
                size={21}
              />
            }
            eyebrow="Pós-treino"
            title="Feedback da sessão"
          />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InformationCard
              label="Sensação"
              value={formatFeeling(
                workoutSession.postWorkoutFeeling
              )}
            />

            <InformationCard
              label="RPE geral"
              value={
                workoutSession.sessionRpe !==
                null
                  ? `${workoutSession.sessionRpe}/10`
                  : "—"
              }
            />

            <div className="col-span-2 sm:col-span-1">
              <InformationCard
                label="Dor relatada"
                value={
                  workoutSession.hasPain ===
                  true
                    ? "Sim"
                    : workoutSession.hasPain ===
                        false
                      ? "Não"
                      : "—"
                }
              />
            </div>
          </div>

          {workoutSession.hasPain && (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck
                    size={19}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    Relato de dor
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={16}
                        className="shrink-0 text-primary"
                      />

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted">
                          Região
                        </p>

                        <p className="mt-0.5 text-sm font-semibold">
                          {workoutSession.painRegion ??
                            "Não informada"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Gauge
                        size={16}
                        className="shrink-0 text-primary"
                      />

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted">
                          Intensidade
                        </p>

                        <p className="mt-0.5 text-sm font-semibold">
                          {workoutSession.painIntensity !==
                          null
                            ? `${workoutSession.painIntensity}/10`
                            : "Não informada"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {workoutSession.painNotes && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted">
                        Observação
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted">
                        {
                          workoutSession.painNotes
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {workoutSession.notes && (
            <div className="mt-3 rounded-xl bg-surface p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                Observações da sessão
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                {workoutSession.notes}
              </p>
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* EXERCÍCIOS */}
        {/* ================================= */}

        <section className="mt-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Execução
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Exercícios realizados
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Cargas e desempenho
              registrados nesta sessão.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {workoutSession.exercises.map(
              (
                sessionExercise,
                index
              ) => {
                const exercise =
                  sessionExercise
                    .workoutExercise
                    .exercise;

                const executionType =
                  sessionExercise
                    .workoutExercise
                    .executionType;

                return (
                  <ExerciseHistoryCard
                    key={
                      sessionExercise.id
                    }
                    number={
                      index + 1
                    }
                    name={
                      exercise.name
                    }
                    block={
                      sessionExercise
                        .workoutExercise
                        .block
                    }
                    executionType={
                      executionType
                    }
                    completed={
                      sessionExercise.completed
                    }
                    sets={
                      sessionExercise.sets
                    }
                  />
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/*
 * ========================================
 * EXERCISE HISTORY
 * ========================================
 */

type HistorySet = {
  id: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  completed: boolean;
};

function ExerciseHistoryCard({
  number,
  name,
  block,
  executionType,
  completed,
  sets,
}: {
  number: number;
  name: string;
  block: string;
  executionType:
    | "REPS"
    | "TIME"
    | "DISTANCE";
  completed: boolean;
  sets: HistorySet[];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* CABEÇALHO */}

      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {formatBlock(block)}
              </p>

              <h3 className="mt-1 font-bold sm:text-lg">
                {name}
              </h3>
            </div>

            {completed && (
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-green-400">
                <CheckCircle2
                  size={15}
                />

                <span className="hidden sm:inline">
                  Concluído
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SÉRIES */}

      <div className="border-t border-border">
        <div
          className={`grid items-center gap-2 bg-surface px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted sm:px-5 ${
            executionType ===
            "REPS"
              ? "grid-cols-[42px_1fr_1fr_1fr]"
              : executionType ===
                  "TIME"
                ? "grid-cols-[42px_1fr_1fr]"
                : "grid-cols-[42px_1fr_1fr_1fr]"
          }`}
        >
          <span>Série</span>

          {executionType ===
            "REPS" && (
            <>
              <span>Carga</span>
              <span>Reps</span>
              <span>RPE</span>
            </>
          )}

          {executionType ===
            "TIME" && (
            <>
              <span>Tempo</span>
              <span>RPE</span>
            </>
          )}

          {executionType ===
            "DISTANCE" && (
            <>
              <span>Dist.</span>
              <span>Carga</span>
              <span>RPE</span>
            </>
          )}
        </div>

        {sets.map(
          (set, index) => (
            <SetHistoryRow
              key={set.id}
              set={set}
              executionType={
                executionType
              }
              hasDivider={
                index <
                sets.length - 1
              }
            />
          )
        )}
      </div>
    </article>
  );
}

/*
 * ========================================
 * SET ROW
 * ========================================
 */

function SetHistoryRow({
  set,
  executionType,
  hasDivider,
}: {
  set: HistorySet;
  executionType:
    | "REPS"
    | "TIME"
    | "DISTANCE";
  hasDivider: boolean;
}) {
  const gridClass =
    executionType === "REPS"
      ? "grid-cols-[42px_1fr_1fr_1fr]"
      : executionType ===
          "TIME"
        ? "grid-cols-[42px_1fr_1fr]"
        : "grid-cols-[42px_1fr_1fr_1fr]";

  return (
    <div
      className={`grid items-center gap-2 px-3 py-3.5 text-sm sm:px-5 ${gridClass} ${
        hasDivider
          ? "border-b border-border"
          : ""
      }`}
    >
      <span className="font-bold text-muted">
        {set.setNumber}
      </span>

      {executionType ===
        "REPS" && (
        <>
          <ValueWithIcon
            icon={
              <Scale size={13} />
            }
            value={
              set.weightKg !== null
                ? `${formatSimpleNumber(set.weightKg)} kg`
                : "—"
            }
          />

          <span className="font-semibold">
            {set.reps ?? "—"}
          </span>

          <span className="font-semibold">
            {set.rpe !== null
              ? set.rpe
              : "—"}
          </span>
        </>
      )}

      {executionType ===
        "TIME" && (
        <>
          <span className="font-semibold">
            {set.durationSeconds !==
            null
              ? formatDuration(
                  set.durationSeconds
                )
              : "—"}
          </span>

          <span className="font-semibold">
            {set.rpe !== null
              ? set.rpe
              : "—"}
          </span>
        </>
      )}

      {executionType ===
        "DISTANCE" && (
        <>
          <span className="font-semibold">
            {set.distanceMeters !==
            null
              ? `${formatSimpleNumber(set.distanceMeters)} m`
              : "—"}
          </span>

          <span className="font-semibold">
            {set.weightKg !== null
              ? `${formatSimpleNumber(set.weightKg)} kg`
              : "—"}
          </span>

          <span className="font-semibold">
            {set.rpe !== null
              ? set.rpe
              : "—"}
          </span>
        </>
      )}
    </div>
  );
}

/*
 * ========================================
 * COMPONENTES
 * ========================================
 */

function SectionHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-bold">
          {title}
        </h2>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-4">
      <div className="text-primary">
        {icon}
      </div>

      <p className="mt-3 truncate text-lg font-bold">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-muted">
        {label}
      </p>
    </div>
  );
}

function InformationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface p-3.5">
      <p className="truncate text-sm font-bold">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-muted">
        {label}
      </p>
    </div>
  );
}

function ValueWithIcon({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1 font-semibold">
      <span className="hidden shrink-0 text-muted sm:inline">
        {icon}
      </span>

      <span className="truncate">
        {value}
      </span>
    </span>
  );
}

/*
 * ========================================
 * FORMATTERS
 * ========================================
 */

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }
  ).format(date);
}

function formatWeight(
  weightKg: number
) {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    }
  ).format(weightKg)} kg`;
}

function formatSimpleNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 1,
    }
  ).format(value);
}

function formatDuration(
  seconds: number
) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}min`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function formatFeeling(
  feeling: string | null
) {
  switch (feeling) {
    case "VERY_GOOD":
      return "Muito bem";

    case "GOOD":
      return "Bem";

    case "NORMAL":
      return "Normal";

    case "TIRED":
      return "Cansado";

    case "VERY_TIRED":
      return "Muito cansado";

    default:
      return "—";
  }
}

function formatPhase(
  phase: string
) {
  switch (phase) {
    case "FOUNDATION":
      return "Fundação";

    case "STRENGTH":
      return "Força";

    case "STRENGTH_ENDURANCE":
      return "Força-resistência";

    case "POWER":
      return "Potência";

    case "BJJ_PERFORMANCE":
      return "Performance BJJ";

    default:
      return phase;
  }
}

function formatBlock(
  block: string
) {
  switch (block) {
    case "ACTIVATION":
      return "Ativação";

    case "MAIN":
      return "Principal";

    case "ACCESSORY":
      return "Acessório";

    case "CORE":
      return "Core";

    case "GRIP":
      return "Pegada";

    case "CONDITIONING":
      return "Condicionamento";

    case "MOBILITY":
      return "Mobilidade";

    default:
      return block;
  }
}