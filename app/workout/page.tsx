import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getActiveTrainingProgram } from "@/lib/training-engine/get-active-program";
import { getNextWorkout } from "@/lib/training-engine/get-next-workout";

import { AdvanceWeekButton } from "@/components/workout/advance-week-button";
import { StartWorkoutButton } from "@/components/workout/start-workout-button";
import { WorkoutProgress } from "@/components/workout/workout-progress";
import { WorkoutCard } from "@/components/workout/workout-card";
import { ExerciseCard } from "@/components/workout/exercise-card";

export default async function WorkoutPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },

      include: {
        athleteProfile: true,
      },
    });

  if (!user) {
    redirect("/login");
  }

  if (!user.athleteProfile) {
    redirect("/onboarding");
  }

  const program =
    await getActiveTrainingProgram(
      user.athleteProfile.id
    );

  /*
   * ========================================
   * SEM PROGRAMA ATIVO
   * ========================================
   */

  if (!program) {
    return (
      <main className="min-h-dvh bg-[#09090b] px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          {/* NAVEGAÇÃO */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
            >
              <ArrowLeft
                size={17}
              />

              Dashboard
            </Link>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 text-center sm:p-10">
            <Dumbbell
              className="mx-auto text-red-500"
              size={36}
            />

            <h1 className="mt-5 text-2xl font-bold">
              Nenhum programa ativo
            </h1>

            <p className="mx-auto mt-3 max-w-md text-zinc-400">
              Seu programa de preparação
              física ainda não foi gerado.
            </p>

            <Link
              href="/dashboard"
              className="mx-auto mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              <ArrowLeft
                size={17}
              />

              Voltar ao dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ========================================
   * TREINO ATUAL
   * ========================================
   */

  const currentWorkout =
    getNextWorkout(
      program.workouts
    );

  const allWorkoutsCompleted =
    currentWorkout === null;

  const isLastProgramWeek =
    program.currentWeek >=
    program.durationWeeks;

  return (
    <main className="min-h-dvh bg-[#09090b] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:py-10">
        {/* ================================= */}
        {/* CABEÇALHO */}
        {/* ================================= */}

        <header className="mb-10">
          {/* NAVEGAÇÃO */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
            >
              <ArrowLeft
                size={17}
              />

              Dashboard
            </Link>
          </div>

          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">
            Preparação Física
          </span>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {allWorkoutsCompleted
                  ? "Semana concluída"
                  : "Treino de hoje"}
              </h1>

              <p className="mt-2 text-zinc-400">
                {program.name}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                <ShieldCheck
                  size={14}
                  className="text-red-500"
                />

                {program.phase}
              </span>

              <span className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                <CalendarDays
                  size={14}
                  className="text-red-500"
                />

                Semana{" "}
                {program.currentWeek} de{" "}
                {program.durationWeeks}
              </span>
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* PROGRESSO */}
        {/* ================================= */}

        <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:mb-10 sm:rounded-3xl sm:p-6">
          <WorkoutProgress
            currentWeek={
              program.currentWeek
            }
            durationWeeks={
              program.durationWeeks
            }
          />
        </section>

        {/* ================================= */}
        {/* PROGRAMA SEMANAL */}
        {/* ================================= */}

        <section className="mb-12">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Programa semanal
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Sua preparação complementar ao
              Jiu-Jitsu.
            </p>
          </div>

          <div className="grid gap-4">
            {program.workouts.map(
              (workout) => {
                const hasCompletedSession =
                  workout.sessions.some(
                    (workoutSession) =>
                      workoutSession.status ===
                      "COMPLETED"
                  );

                const hasActiveSession =
                  workout.sessions.some(
                    (workoutSession) =>
                      workoutSession.status ===
                      "IN_PROGRESS"
                  );

                return (
                  <div
                    key={workout.id}
                    className="relative"
                  >
                    <WorkoutCard
                      code={workout.code}
                      name={workout.name}
                      description={
                        workout.description
                      }
                      duration={
                        workout.estimatedDurationMinutes
                      }
                      exerciseCount={
                        workout.exercises.length
                      }
                      selected={
                        workout.id ===
                        currentWorkout?.id
                      }
                    />

                    {hasCompletedSession && (
                      <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-400">
                        <CheckCircle2
                          size={13}
                        />

                        Concluído
                      </div>
                    )}

                    {!hasCompletedSession &&
                      hasActiveSession && (
                        <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                          Em andamento
                        </div>
                      )}
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* ================================= */}
        {/* TREINO ATUAL */}
        {/* ================================= */}

        {currentWorkout && (
          <section>
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                  Treino{" "}
                  {currentWorkout.code}
                </span>

                <h2 className="mt-2 text-2xl font-bold">
                  {currentWorkout.name}
                </h2>

                {currentWorkout.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {
                      currentWorkout.description
                    }
                  </p>
                )}
              </div>

              <div className="text-sm text-zinc-500">
                {
                  currentWorkout
                    .estimatedDurationMinutes
                }{" "}
                minutos
              </div>
            </div>

            <div className="space-y-3">
              {currentWorkout.exercises.map(
                (item) => {
                  /*
                   * getActiveTrainingProgram()
                   * já filtrou a coleção para
                   * program.currentWeek.
                   */

                  const prescription =
                    item
                      .weeklyPrescriptions[0];

                  /*
                   * A prescrição semanal é
                   * sempre a fonte principal.
                   *
                   * WorkoutExercise permanece
                   * como fallback para programas
                   * antigos ou incompletos.
                   */

                  const sets =
                    prescription?.sets ??
                    item.sets;

                  const repsMin =
                    prescription?.repsMin ??
                    item.repsMin;

                  const repsMax =
                    prescription?.repsMax ??
                    item.repsMax;

                  const durationSeconds =
                    prescription?.durationSeconds ??
                    item.durationSeconds;

                  const distanceMeters =
                    prescription?.distanceMeters ??
                    item.distanceMeters;

                  const restSeconds =
                    prescription?.restSeconds ??
                    item.restSeconds;

                  const targetRpe =
                    prescription?.targetRpe ??
                    item.targetRpe;

                  /*
                   * O tipo de execução também
                   * deve acompanhar a prescrição
                   * da semana.
                   *
                   * REPS
                   * TIME
                   * DISTANCE
                   */

                  const executionType =
                    prescription?.executionType ??
                    item.executionType;

                  return (
                    <ExerciseCard
                      key={item.id}
                      workoutExerciseId={
                        item.id
                      }
                      order={item.order}
                      name={
                        item.exercise.name
                      }
                      block={item.block}
                      executionType={
                        executionType
                      }
                      sets={sets}
                      repsMin={repsMin}
                      repsMax={repsMax}
                      durationSeconds={
                        durationSeconds
                      }
                      distanceMeters={
                        distanceMeters
                      }
                      restSeconds={
                        restSeconds
                      }
                      targetRpe={
                        targetRpe
                      }
                      progressionDecision={
                        prescription?.progressionDecision
                      }
                      suggestedWeightKg={
                        prescription?.suggestedWeightKg
                      }
                      previousAverageWeightKg={
                        prescription?.previousAverageWeightKg
                      }
                      previousAverageReps={
                        prescription?.previousAverageReps
                      }
                      previousAverageRpe={
                        prescription?.previousAverageRpe
                      }
                      previousAverageDurationSeconds={
                        prescription?.previousAverageDurationSeconds
                      }
                      previousAverageDistanceMeters={
                        prescription?.previousAverageDistanceMeters
                      }
                    />
                  );
                }
              )}
            </div>

            <StartWorkoutButton
              workoutId={
                currentWorkout.id
              }
            />
          </section>
        )}

        {/* ================================= */}
        {/* SEMANA CONCLUÍDA */}
        {/* ================================= */}

        {allWorkoutsCompleted && (
          <section className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center sm:rounded-3xl sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
              <Trophy
                size={30}
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
              Semana{" "}
              {program.currentWeek}
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {isLastProgramWeek
                ? "Programa concluído!"
                : "Semana concluída!"}
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-400">
              {isLastProgramWeek
                ? "Você concluiu todas as semanas previstas para este ciclo de treinamento."
                : "Você concluiu todos os treinos previstos para esta semana do programa."}
            </p>

            <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-4 text-sm text-zinc-400">
              <CheckCircle2
                size={18}
                className="text-green-400"
              />

              {
                program.workouts
                  .length
              }{" "}
              de{" "}
              {
                program.workouts
                  .length
              }{" "}
              treinos concluídos
            </div>

            {!isLastProgramWeek && (
              <div className="mx-auto mt-6 max-w-sm">
                <AdvanceWeekButton
                  currentWeek={
                    program.currentWeek
                  }
                  durationWeeks={
                    program.durationWeeks
                  }
                />
              </div>
            )}

            {isLastProgramWeek && (
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-sm font-semibold text-green-400">
                  Ciclo de treinamento
                  completo
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  O próximo ciclo será
                  definido a partir da
                  evolução registrada neste
                  programa.
                </p>
              </div>
            )}

            {/* VOLTAR AO DASHBOARD */}
            <Link
              href="/dashboard"
              className="mx-auto mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft
                size={17}
              />

              Voltar ao dashboard
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}