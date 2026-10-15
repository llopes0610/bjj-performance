import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Gauge,
  Medal,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

export default async function DashboardPage() {
  /*
   * ========================================
   * AUTENTICAÇÃO
   * ========================================
   */

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email:
          session.user.email,
      },

      select: {
        onboardingCompleted:
          true,

        athleteProfile: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!user) {
    redirect("/login");
  }

  if (
    !user.onboardingCompleted ||
    !user.athleteProfile
  ) {
    redirect("/onboarding");
  }

  /*
   * ========================================
   * DASHBOARD DATA
   * ========================================
   */

  const dashboard =
    await getDashboardData(
      user.athleteProfile.id
    );

  if (!dashboard) {
    redirect("/onboarding");
  }

  const {
    athlete,
    program,
    week,
    nextWorkout,
    performance,
    recovery,
    gamification,
    stats,
  } = dashboard;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6 sm:py-10">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header>
          <p className="text-sm text-muted">
            Bem-vindo,
          </p>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {athlete.name}
              </h1>

              {program && (
                <p className="mt-2 text-sm text-muted">
                  Semana{" "}
                  {program.currentWeek}{" "}
                  de{" "}
                  {program.durationWeeks}
                  {" • "}
                  {program.name}
                </p>
              )}
            </div>

            <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted">
              Nível{" "}
              {athlete.currentLevel}
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* SEM PROGRAMA ATIVO */}
        {/* ================================= */}

        {!program && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:mt-8 sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Dumbbell
                size={22}
              />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Nenhum programa ativo
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
              Seu perfil está
              configurado, mas não há
              um programa de
              preparação física ativo
              neste momento.
            </p>

            <Link
              href="/workout"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto"
            >
              Ver treinamento

              <ArrowRight
                size={18}
              />
            </Link>
          </section>
        )}

        {program && (
          <>
            {/* ============================= */}
            {/* PRÓXIMO TREINO */}
            {/* ============================= */}

            <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card sm:mt-8">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Dumbbell
                        size={22}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        {nextWorkout
                          ? nextWorkout.inProgress
                            ? "Treino em andamento"
                            : "Próximo treino"
                          : "Semana concluída"}
                      </p>

                      {nextWorkout ? (
                        <>
                          <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                            Treino{" "}
                            {
                              nextWorkout.code
                            }
                            {" — "}
                            {
                              nextWorkout.name
                            }
                          </h2>

                          {nextWorkout.description && (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                              {
                                nextWorkout.description
                              }
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                            Todos os treinos
                            concluídos
                          </h2>

                          <p className="mt-2 text-sm leading-6 text-muted">
                            Você concluiu
                            todos os treinos
                            prescritos para a
                            semana{" "}
                            {
                              program.currentWeek
                            }
                            .
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {week.isCompleted && (
                    <CheckCircle2
                      size={24}
                      className="shrink-0 text-green-500"
                    />
                  )}
                </div>

                {nextWorkout && (
                  <>
                    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
                      <SmallInfo
                        icon={
                          <Clock3
                            size={16}
                          />
                        }
                        value={`${nextWorkout.estimatedDurationMinutes} min`}
                        label="Duração"
                      />

                      <SmallInfo
                        icon={
                          <Dumbbell
                            size={16}
                          />
                        }
                        value={`${nextWorkout.exerciseCount}`}
                        label="Exercícios"
                      />
                    </div>

                    <Link
                      href="/workout"
                      className="mt-5 flex min-h-12 w-full items-center justify-between rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition hover:opacity-90"
                    >
                      <span className="flex items-center gap-3">
                        <Dumbbell
                          size={19}
                        />

                        {nextWorkout.inProgress
                          ? "Continuar treino"
                          : "Ver próximo treino"}
                      </span>

                      <ArrowRight
                        size={19}
                      />
                    </Link>
                  </>
                )}

                {!nextWorkout && (
                  <Link
                    href="/workout"
                    className="mt-5 flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-surface px-5 py-3.5 font-semibold transition hover:border-primary/40"
                  >
                    Ver semana de
                    treinamento

                    <ArrowRight
                      size={19}
                    />
                  </Link>
                )}
              </div>
            </section>

            {/* ============================= */}
            {/* PROGRESSO SEMANAL */}
            {/* ============================= */}

            <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    Progresso semanal
                  </p>

                  <h2 className="mt-2 text-xl font-bold">
                    {
                      week.completedWorkouts
                    }
                    /
                    {
                      week.totalWorkouts
                    }{" "}
                    treinos
                  </h2>
                </div>

                <span className="text-2xl font-bold text-primary">
                  {
                    week.completionPercentage
                  }
                  %
                </span>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${week.completionPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-5 space-y-2.5">
                {week.workouts.map(
                  (workout) => (
                    <WeeklyWorkoutRow
                      key={workout.id}
                      code={
                        workout.code
                      }
                      name={
                        workout.name
                      }
                      duration={
                        workout.estimatedDurationMinutes
                      }
                      exerciseCount={
                        workout.exerciseCount
                      }
                      status={
                        workout.status
                      }
                    />
                  )
                )}
              </div>

              <div className="mt-4 flex justify-between gap-3 text-xs text-muted">
                <span>
                  Semana{" "}
                  {
                    program.currentWeek
                  }
                </span>

                <span>
                  {
                    program.durationWeeks
                  }{" "}
                  semanas no programa
                </span>
              </div>
            </section>

            {/* ============================= */}
            {/* KPIs */}
            {/* ============================= */}

            <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                icon={
                  <Dumbbell
                    size={19}
                  />
                }
                value={`${stats.completedSessions}`}
                label="Treinos concluídos"
              />

              <KpiCard
                icon={
                  <Flame
                    size={19}
                  />
                }
                value={`${stats.currentStreak}`}
                label="Sequência atual"
              />

              <KpiCard
                icon={
                  <TrendingUp
                    size={19}
                  />
                }
                value={`${performance.progressions}`}
                label="Progressões"
              />

              <KpiCard
                icon={
                  <Activity
                    size={19}
                  />
                }
                value={`${recovery.lastSessionRpe ?? "—"}`}
                label="Último RPE"
              />
            </section>

            {/* ============================= */}
            {/* PERFORMANCE */}
            {/* ============================= */}

            <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Resposta ao
                  treinamento
                </p>

                <h2 className="mt-2 text-lg font-bold sm:text-xl">
                  Prescrição da semana
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Como o motor ajustou
                  seus exercícios para
                  esta semana.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                <DecisionMetric
                  icon={
                    <TrendingUp
                      size={18}
                    />
                  }
                  value={
                    performance.progressions
                  }
                  label="Progrediram"
                />

                <DecisionMetric
                  icon={
                    <Minus
                      size={18}
                    />
                  }
                  value={
                    performance.maintained
                  }
                  label="Mantidos"
                />

                <DecisionMetric
                  icon={
                    <TrendingDown
                      size={18}
                    />
                  }
                  value={
                    performance.regressions
                  }
                  label="Regrediram"
                />
              </div>
            </section>

            {/* ============================= */}
            {/* RECUPERAÇÃO */}
            {/* ============================= */}

            <RecoveryCard
              sessionId={
                recovery.sessionId
              }
              status={
                recovery.status
              }
              fatigueScore={
                recovery.fatigueScore
              }
              progressionPermission={
                recovery.progressionPermission
              }
              shouldReduceVolume={
                recovery.shouldReduceVolume
              }
              shouldBlockProgression={
                recovery.shouldBlockProgression
              }
              shouldConsiderExerciseSubstitution={
                recovery.shouldConsiderExerciseSubstitution
              }
              reasons={
                recovery.reasons
              }
              rpe={
                recovery.lastSessionRpe
              }
              feeling={
                recovery.feeling
              }
              hasPain={
                recovery.hasPain
              }
              painRegion={
                recovery.painRegion
              }
              painIntensity={
                recovery.painIntensity
              }
              workoutCode={
                recovery.workoutCode
              }
              workoutName={
                recovery.workoutName
              }
            />
          </>
        )}

        {/* ================================= */}
        {/* GAMIFICAÇÃO */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Evolução
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Nível{" "}
                {gamification.level}
              </h2>
            </div>

            <span className="text-sm font-semibold text-primary">
              {gamification.totalXp} XP
            </span>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${gamification.progressPercentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
            <span>
              {
                gamification.currentLevelXp
              }
              /
              {
                gamification.xpRequiredForLevel
              }{" "}
              XP
            </span>

            <span>
              {
                gamification.xpToNextLevel
              }{" "}
              XP para o nível{" "}
              {gamification.level + 1}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <SmallInfo
              icon={
                <Flame size={16} />
              }
              value={`${gamification.currentStreak}`}
              label="Semanas seguidas"
            />

            <SmallInfo
              icon={
                <Zap size={16} />
              }
              value={`${gamification.longestStreak}`}
              label="Recorde"
            />

            <SmallInfo
              icon={
                <Trophy size={16} />
              }
              value={`${gamification.achievementsUnlocked}/${gamification.achievementsTotal}`}
              label="Conquistas"
            />
          </div>

          {gamification.recentAchievements
            .length > 0 ? (
            <div className="mt-5 space-y-2">
              {gamification.recentAchievements.map(
                (achievement) => (
                  <div
                    key={
                      achievement.code
                    }
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                      <Trophy
                        size={15}
                        className="shrink-0 text-primary"
                      />

                      <span className="truncate">
                        {
                          achievement.name
                        }
                      </span>
                    </span>

                    <span className="shrink-0 text-xs text-muted">
                      +
                      {
                        achievement.xpReward
                      }{" "}
                      XP
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted">
              Conclua seu primeiro treino
              para desbloquear a primeira
              conquista.
            </p>
          )}
        </section>

        {/* ================================= */}
        {/* PERFIL */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Medal
                size={21}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Perfil do atleta
              </p>

              <p className="mt-1 font-bold">
                Nível{" "}
                {
                  athlete.currentLevel
                }
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <ProfileMetric
              value={`${athlete.weightKg}`}
              label="kg"
            />

            <ProfileMetric
              value={`${athlete.heightCm}`}
              label="cm"
            />

            <ProfileMetric
              value={`${athlete.bjjDaysPerWeek}x`}
              label="BJJ/sem"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

/*
 * ========================================
 * KPI
 * ========================================
 */

function KpiCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="text-primary">
        {icon}
      </div>

      <p className="mt-4 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted">
        {label}
      </p>
    </div>
  );
}

/*
 * ========================================
 * SMALL INFO
 * ========================================
 */

function SmallInfo({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
      <div className="shrink-0 text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {value}
        </p>

        <p className="text-[11px] text-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

/*
 * ========================================
 * TREINO SEMANAL
 * ========================================
 */

function WeeklyWorkoutRow({
  code,
  name,
  duration,
  exerciseCount,
  status,
}: {
  code: string;
  name: string;
  duration: number;
  exerciseCount: number;
  status:
    | "COMPLETED"
    | "IN_PROGRESS"
    | "NEXT"
    | "PENDING";
}) {
  const statusConfig = {
    COMPLETED: {
      label:
        "Concluído",

      icon: (
        <CheckCircle2
          size={17}
        />
      ),

      className:
        "border-green-500/20 bg-green-500/5 text-green-400",
    },

    IN_PROGRESS: {
      label:
        "Em andamento",

      icon: (
        <Activity
          size={17}
        />
      ),

      className:
        "border-amber-500/20 bg-amber-500/5 text-amber-400",
    },

    NEXT: {
      label:
        "Próximo",

      icon: (
        <ArrowRight
          size={17}
        />
      ),

      className:
        "border-primary/30 bg-primary/5 text-primary",
    },

    PENDING: {
      label:
        "Pendente",

      icon: (
        <Clock3
          size={17}
        />
      ),

      className:
        "border-border bg-surface text-muted",
    },
  } as const;

  const current =
    statusConfig[status];

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${current.className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/10 font-bold">
          {code}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {name}
          </p>

          <p className="mt-0.5 text-[11px] text-muted">
            {exerciseCount}{" "}
            exercícios
            {" • "}
            {duration} min
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
        {current.icon}

        <span className="hidden sm:inline">
          {current.label}
        </span>
      </div>
    </div>
  );
}

/*
 * ========================================
 * DECISION METRIC
 * ========================================
 */

function DecisionMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface p-3 sm:p-4">
      <div className="text-primary">
        {icon}
      </div>

      <p className="mt-3 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 break-words text-[11px] leading-4 text-muted sm:text-xs">
        {label}
      </p>
    </div>
  );
}

/*
 * ========================================
 * RECOVERY
 * ========================================
 */

function RecoveryCard({
  sessionId,
  status,
  fatigueScore,
  progressionPermission,
  shouldReduceVolume,
  shouldBlockProgression,
  shouldConsiderExerciseSubstitution,
  reasons,
  rpe,
  feeling,
  hasPain,
  painRegion,
  painIntensity,
  workoutCode,
  workoutName,
}: {
  sessionId:
    | string
    | null;

  status:
    | "READY"
    | "CAUTION"
    | "FATIGUED"
    | "PAIN_ALERT"
    | "NO_DATA";

  fatigueScore:
    | number
    | null;

  progressionPermission:
    | "ALLOW"
    | "HOLD"
    | "REGRESS"
    | null;

  shouldReduceVolume: boolean;

  shouldBlockProgression: boolean;

  shouldConsiderExerciseSubstitution:
    boolean;

  reasons: string[];

  rpe:
    | number
    | null;

  feeling:
    | string
    | null;

  hasPain:
    | boolean
    | null;

  painRegion:
    | string
    | null;

  painIntensity:
    | number
    | null;

  workoutCode:
    | string
    | null;

  workoutName:
    | string
    | null;
}) {
  const config = {
    READY: {
      title:
        "Recuperação adequada",

      description:
        "Os indicadores do último feedback estão dentro da faixa esperada para a prescrição.",

      icon: (
        <ShieldCheck
          size={22}
        />
      ),

      badge:
        "Adequada",
    },

    CAUTION: {
      title:
        "Atenção à recuperação",

      description:
        "O último feedback indica que a progressão deve ser tratada de forma mais conservadora.",

      icon: (
        <Gauge
          size={22}
        />
      ),

      badge:
        "Cautela",
    },

    FATIGUED: {
      title:
        "Fadiga elevada",

      description:
        "Os indicadores pós-treino apontam fadiga elevada e podem exigir redução da progressão.",

      icon: (
        <Activity
          size={22}
        />
      ),

      badge:
        "Fadiga",
    },

    PAIN_ALERT: {
      title:
        "Atenção ao relato de dor",

      description:
        "O relato de dor recebeu prioridade na análise de segurança da última sessão.",

      icon: (
        <AlertTriangle
          size={22}
        />
      ),

      badge:
        "Atenção",
    },

    NO_DATA: {
      title:
        "Aguardando dados",

      description:
        "Conclua um treino e envie o feedback pós-treino para iniciar o acompanhamento de recuperação.",

      icon: (
        <ShieldCheck
          size={22}
        />
      ),

      badge:
        "Sem dados",
    },
  } as const;

  const current =
    config[status];

  const fatiguePercentage =
    fatigueScore !== null
      ? Math.min(
          100,
          Math.max(
            0,
            fatigueScore * 10
          )
        )
      : 0;

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {current.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Recuperação
            </p>

            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
              {current.badge}
            </span>
          </div>

          <h2 className="mt-1 text-lg font-bold">
            {current.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            {
              current.description
            }
          </p>
        </div>
      </div>

      {(workoutName ||
        workoutCode) && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Último treino
              </p>

              <p className="mt-1 truncate text-sm font-semibold">
                {workoutCode
                  ? `Treino ${workoutCode}`
                  : "Treino"}
                {workoutName
                  ? ` — ${workoutName}`
                  : ""}
              </p>
            </div>

            {sessionId && (
              <Link
                href={`/history/${sessionId}`}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                <span className="hidden sm:inline">
                  Ver detalhes
                </span>

                <ArrowRight
                  size={16}
                />
              </Link>
            )}
          </div>
        </div>
      )}

      {(rpe !== null ||
        feeling !== null ||
        hasPain !== null) && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <ProfileMetric
            value={
              rpe !== null
                ? `${rpe}/10`
                : "—"
            }
            label="RPE da sessão"
          />

          <ProfileMetric
            value={
              formatFeeling(
                feeling
              )
            }
            label="Sensação"
          />

          <div className="col-span-2 sm:col-span-1">
            <ProfileMetric
              value={
                hasPain
                  ? painRegion ??
                    "Relatada"
                  : hasPain ===
                      false
                    ? "Não"
                    : "—"
              }
              label="Dor"
            />
          </div>
        </div>
      )}

      {hasPain &&
        painIntensity !== null && (
          <div className="mt-3 rounded-xl border border-border bg-surface p-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                  Intensidade da dor
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {painRegion ??
                    "Região relatada"}
                </p>
              </div>

              <span className="text-lg font-bold">
                {
                  painIntensity
                }
                /10
              </span>
            </div>
          </div>
        )}

      {fatigueScore !== null && (
        <div className="mt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Indicador de fadiga
              </p>

              <p className="mt-1 text-sm text-muted">
                Baseado no último
                feedback pós-treino.
              </p>
            </div>

            <p className="shrink-0 text-lg font-bold">
              {fatigueScore.toFixed(
                1
              )}
              /10
            </p>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${fatiguePercentage}%`,
              }}
            />
          </div>
        </div>
      )}

      {progressionPermission && (
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            Impacto na prescrição
          </p>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <SafetyDecision
              label="Progressão"
              value={formatProgressionPermission(
                progressionPermission
              )}
              active={
                progressionPermission !==
                "ALLOW"
              }
            />

            <SafetyDecision
              label="Reduzir volume"
              value={
                shouldReduceVolume
                  ? "Sim"
                  : "Não"
              }
              active={
                shouldReduceVolume
              }
            />

            <SafetyDecision
              label="Progressão bloqueada"
              value={
                shouldBlockProgression
                  ? "Sim"
                  : "Não"
              }
              active={
                shouldBlockProgression
              }
            />

            <SafetyDecision
              label="Considerar substituição"
              value={
                shouldConsiderExerciseSubstitution
                  ? "Sim"
                  : "Não"
              }
              active={
                shouldConsiderExerciseSubstitution
              }
            />
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            Análise do último feedback
          </p>

          <div className="mt-3 space-y-2.5">
            {reasons.map(
              (reason, index) => (
                <div
                  key={`${reason}-${index}`}
                  className="flex items-start gap-2.5"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                  <p className="text-sm leading-5 text-muted">
                    {reason}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SafetyDecision({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3.5">
      <p className="text-xs text-muted">
        {label}
      </p>

      <p
        className={`text-xs font-bold ${
          active
            ? "text-primary"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatProgressionPermission(
  permission:
    | "ALLOW"
    | "HOLD"
    | "REGRESS"
) {
  switch (permission) {
    case "ALLOW":
      return "Permitida";

    case "HOLD":
      return "Manter";

    case "REGRESS":
      return "Reduzir";

    default:
      return "—";
  }
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

/*
 * ========================================
 * PROFILE METRIC
 * ========================================
 */

function ProfileMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface p-3 text-center">
      <p className="truncate font-bold">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-muted sm:text-xs">
        {label}
      </p>
    </div>
  );
}