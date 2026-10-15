import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Home,
  Trophy,
  Zap,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getSessionGamification } from "@/lib/gamification/get-session-gamification";
import { prisma } from "@/lib/prisma";

interface CompletedWorkoutPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompletedWorkoutPage({
  params,
}: CompletedWorkoutPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const workoutSession =
    await prisma.workoutSession.findFirst({
      where: {
        id,

        status: "COMPLETED",

        athlete: {
          user: {
            email: session.user.email,
          },
        },
      },

      include: {
        workout: true,

        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

  if (!workoutSession) {
    notFound();
  }

  /*
   * Recompensas lidas do ledger do
   * servidor, nunca de parâmetros do
   * cliente.
   */
  const gamification =
    await getSessionGamification({
      athleteId:
        workoutSession.athleteId,
      workoutId:
        workoutSession.workoutId,
      programWeek:
        workoutSession.programWeek,
      completedAt:
        workoutSession.completedAt,
    });

  const totalSets =
    workoutSession.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.length,
      0
    );

  return (
    <main className="min-h-dvh bg-[#09090b] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4 py-6 sm:px-6 sm:py-12">
        <div className="w-full rounded-2xl border border-green-500/20 bg-green-500/5 p-5 sm:rounded-3xl sm:p-7">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
            <CheckCircle2 size={32} />
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
            Treino finalizado
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Bom trabalho.
          </h1>

          <p className="mt-3 text-zinc-400">
            {workoutSession.workout.name}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <Dumbbell
                size={19}
                className="text-red-500"
              />

              <p className="mt-3 text-2xl font-bold">
                {totalSets}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Séries realizadas
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <Clock3
                size={19}
                className="text-red-500"
              />

              <p className="mt-3 text-2xl font-bold">
                {workoutSession.durationMinutes ??
                  0}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Minutos
              </p>
            </div>
          </div>

          {/* GAMIFICAÇÃO */}
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Zap
                  size={19}
                  className="shrink-0 text-red-500"
                />

                <p className="truncate text-sm font-semibold">
                  {gamification.xpEarned > 0
                    ? `+${gamification.xpEarned} XP`
                    : `${gamification.level.totalXp} XP no total`}
                </p>
              </div>

              <p className="shrink-0 text-xs text-zinc-500">
                Nível{" "}
                {gamification.level.level}
              </p>
            </div>

            {gamification.rewards.length >
            0 ? (
              <ul className="mt-4 space-y-2">
                {gamification.rewards.map(
                  (reward, index) => (
                    <li
                      key={`${reward.type}-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-zinc-300">
                        {reward.type ===
                        "ACHIEVEMENT" ? (
                          <Trophy
                            size={15}
                            className="shrink-0 text-amber-400"
                          />
                        ) : (
                          <CheckCircle2
                            size={15}
                            className="shrink-0 text-green-400"
                          />
                        )}

                        <span className="truncate">
                          {reward.label}
                        </span>
                      </span>

                      <span className="shrink-0 font-semibold text-zinc-200">
                        +{reward.xp}
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              gamification.alreadyRewarded && (
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Este treino já tinha sido
                pontuado nesta semana. O XP
                recompensa a programação
                prescrita, não sessões extras.
              </p>
              )
            )}

            {/* PROGRESSO DO NÍVEL */}
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-600"
                  style={{
                    width: `${gamification.level.progressPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                {
                  gamification.level
                    .xpToNextLevel
                }{" "}
                XP para o nível{" "}
                {gamification.level.level +
                  1}
              </p>
            </div>

            {gamification.weekCompleted && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2.5 text-sm text-green-400">
                <Flame
                  size={16}
                  className="shrink-0"
                />
                Semana concluída • sequência
                de{" "}
                {gamification.currentStreak}{" "}
                {gamification.currentStreak ===
                1
                  ? "semana"
                  : "semanas"}
              </div>
            )}
          </div>

          <Link
            href="/dashboard"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-500"
          >
            <Home size={19} />
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}