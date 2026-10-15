import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  Flame,
  Lock,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  getProgressData,
  type ProgressData,
} from "@/lib/gamification/get-progress-data";
import { prisma } from "@/lib/prisma";

export default async function ProgressPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },

      select: {
        onboardingCompleted: true,

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

  const progress =
    await getProgressData(
      user.athleteProfile.id
    );

  const {
    level,
    achievements,
    recentEvents,
  } = progress;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:py-10 sm:pb-28 lg:pb-12">
        {/* ================================= */}
        {/* CABEÇALHO */}
        {/* ================================= */}

        <Link
          href="/dashboard"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={17} />
          Voltar ao início
        </Link>

        <header>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Trophy size={23} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Evolução
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Progresso e conquistas
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                O XP recompensa
                consistência: treinos
                prescritos concluídos,
                semanas completas e marcos
                de treinamento.
              </p>
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* NÍVEL */}
        {/* ================================= */}

        <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Nível atual
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {level.level}
              </h2>
            </div>

            <span className="text-sm font-semibold text-primary">
              {level.totalXp} XP
            </span>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${level.progressPercentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
            <span>
              {level.currentLevelXp}/
              {level.xpRequiredForLevel}{" "}
              XP
            </span>

            <span>
              {level.xpToNextLevel} XP
              para o nível{" "}
              {level.level + 1}
            </span>
          </div>
        </section>

        {/* ================================= */}
        {/* RESUMO */}
        {/* ================================= */}

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            icon={<Flame size={18} />}
            value={`${progress.currentStreak}`}
            label="Semanas seguidas"
          />

          <SummaryCard
            icon={<Zap size={18} />}
            value={`${progress.longestStreak}`}
            label="Maior sequência"
          />

          <SummaryCard
            icon={
              <Dumbbell size={18} />
            }
            value={`${progress.completedWorkouts}`}
            label="Treinos prescritos"
          />

          <SummaryCard
            icon={
              <Trophy size={18} />
            }
            value={`${progress.achievementsUnlocked}/${achievements.length}`}
            label="Conquistas"
          />
        </section>

        {/* ================================= */}
        {/* CONQUISTAS */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Conquistas
          </p>

          {achievements.length > 0 ? (
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {achievements.map(
                (achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={
                      achievement
                    }
                  />
                )
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Nenhuma conquista
              disponível no momento.
            </p>
          )}
        </section>

        {/* ================================= */}
        {/* EXTRATO DE XP */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            XP recente
          </p>

          {recentEvents.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {recentEvents.map(
                (event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {formatEventLabel(
                          event
                        )}
                      </p>

                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatDate(
                          event.createdAt
                        )}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-primary">
                      +{event.xp}
                    </span>
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Conclua seu primeiro treino
              para começar a acumular XP.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

/*
 * ========================================
 * COMPONENTES
 * ========================================
 */

function SummaryCard({
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

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted">
        {label}
      </p>
    </div>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: ProgressData["achievements"][number];
}) {
  const unlocked =
    achievement.unlockedAt !== null;

  const progressPercentage =
    achievement.progress &&
    achievement.progress.target > 0
      ? Math.round(
          (achievement.progress
            .current /
            achievement.progress
              .target) *
            100
        )
      : 0;

  return (
    <div
      className={`min-w-0 rounded-xl border p-3.5 ${
        unlocked
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            unlocked
              ? "bg-primary/10 text-primary"
              : "bg-card text-muted"
          }`}
        >
          {unlocked ? (
            <Trophy size={18} />
          ) : (
            <Lock size={17} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-bold ${
                unlocked
                  ? ""
                  : "text-muted"
              }`}
            >
              {achievement.name}
            </p>

            <span className="shrink-0 text-xs font-semibold text-muted">
              +{achievement.xpReward} XP
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-muted">
            {achievement.description}
          </p>

          {unlocked &&
            achievement.unlockedAt && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <CheckCircle2
                  size={13}
                />
                Desbloqueada em{" "}
                {formatDate(
                  achievement.unlockedAt
                )}
              </p>
            )}

          {!unlocked &&
            achievement.progress && (
              <div className="mt-2.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-muted">
                  {
                    achievement.progress
                      .current
                  }
                  /
                  {
                    achievement.progress
                      .target
                  }
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/*
 * ========================================
 * FORMATAÇÃO
 * ========================================
 */

function formatEventLabel(
  event: ProgressData["recentEvents"][number]
) {
  switch (event.type) {
    case "WORKOUT_COMPLETED":
      return "Treino concluído";

    case "WEEK_COMPLETED":
      return (
        event.description ??
        "Semana concluída"
      );

    case "ACHIEVEMENT_UNLOCKED":
      return (
        event.description ??
        "Conquista desbloqueada"
      );

    default:
      return (
        event.description ?? "XP"
      );
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )
    .format(date)
    .replace(".", "");
}
