import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { FinishWorkoutButton } from "@/components/workout/finish-workout-button";

import {
  WorkoutSetRow,
  type ExerciseExecutionType,
} from "@/components/workout/workout-set-row";

interface WorkoutSessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkoutSessionPage({
  params,
}: WorkoutSessionPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } =
    await params;

  const workoutSession =
    await prisma.workoutSession.findFirst({
      where: {
        id,

        athlete: {
          user: {
            email:
              session.user.email,
          },
        },
      },

      include: {
        workout: true,

        exercises: {
          orderBy: {
            order: "asc",
          },

          include: {
            workoutExercise: {
              include: {
                exercise: true,

                weeklyPrescriptions:
                  true,
              },
            },

            sets: {
              orderBy: {
                setNumber:
                  "asc",
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
   * Se o usuário tentar acessar uma
   * sessão já concluída, enviamos para
   * o resumo final.
   */
  if (
    workoutSession.status ===
    "COMPLETED"
  ) {
    redirect(
      `/workout/session/${workoutSession.id}/completed`
    );
  }

  const totalExercises =
    workoutSession.exercises.length;

  const completedExercises =
    workoutSession.exercises.filter(
      (exercise) =>
        exercise.completed
    ).length;

  const allExercisesCompleted =
    totalExercises > 0 &&
    completedExercises ===
      totalExercises;

  return (
    <main className="min-h-dvh bg-[#09090b] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-5 sm:px-6 sm:py-10">
        <Link
          href="/workout"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft
            size={16}
          />

          Voltar
        </Link>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:mt-10 sm:rounded-3xl sm:p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 text-red-500">
            <Dumbbell
              size={26}
            />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            Sessão iniciada
          </p>

          <h1 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
            {
              workoutSession
                .workout.name
            }
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Registre o desempenho
            realizado em cada série.
            Utilize o RPE para informar
            o esforço percebido.
          </p>
        </div>

        <section className="mt-8">
          <div>
            <h2 className="text-lg font-semibold">
              Exercícios da sessão
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Complete todas as
              séries para finalizar
              cada exercício.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {workoutSession.exercises.map(
              (
                sessionExercise
              ) => {
                const prescription =
                  sessionExercise
                    .workoutExercise;

                const exercise =
                  prescription.exercise;

                /*
                 * A prescrição semanal deve
                 * corresponder exatamente à
                 * semana em que esta sessão
                 * foi criada.
                 *
                 * Isso é importante inclusive
                 * ao consultar sessões antigas.
                 */
                const weeklyPrescription =
                  prescription.weeklyPrescriptions.find(
                    (item) =>
                      item.programWeek ===
                      workoutSession.programWeek
                  );

                const executionType =
                  (weeklyPrescription?.executionType ??
                    prescription.executionType) as ExerciseExecutionType;

                const prescribedSets =
                  weeklyPrescription?.sets ??
                  prescription.sets;

                const repsMin =
                  weeklyPrescription?.repsMin ??
                  prescription.repsMin;

                const repsMax =
                  weeklyPrescription?.repsMax ??
                  prescription.repsMax;

                const durationSeconds =
                  weeklyPrescription?.durationSeconds ??
                  prescription.durationSeconds;

                const distanceMeters =
                  weeklyPrescription?.distanceMeters ??
                  prescription.distanceMeters;

                const targetRpe =
                  weeklyPrescription?.targetRpe ??
                  prescription.targetRpe;

                const completedSets =
                  sessionExercise.sets.filter(
                    (set) =>
                      set.completed
                  ).length;

                const totalSets =
                  sessionExercise.sets.length;

                return (
                  <div
                    key={
                      sessionExercise.id
                    }
                    className={[
                      "rounded-2xl border p-4 transition sm:p-5",

                      sessionExercise.completed
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-zinc-800 bg-zinc-900/50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {
                            exercise.name
                          }
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {
                            prescribedSets
                          }{" "}
                          séries

                          {repsMin !==
                            null &&
                          repsMin !==
                            undefined &&
                          repsMax !==
                            null &&
                          repsMax !==
                            undefined
                            ? ` × ${repsMin}–${repsMax} reps`
                            : ""}

                          {durationSeconds !==
                            null &&
                          durationSeconds !==
                            undefined
                            ? ` × ${durationSeconds}s`
                            : ""}

                          {distanceMeters !==
                            null &&
                          distanceMeters !==
                            undefined
                            ? ` × ${distanceMeters}m`
                            : ""}

                          {targetRpe !==
                            null &&
                          targetRpe !==
                            undefined
                            ? ` • RPE ${targetRpe}`
                            : ""}
                        </p>

                        <p className="mt-2 text-xs text-zinc-600">
                          {
                            completedSets
                          }
                          /
                          {totalSets}{" "}
                          séries
                          concluídas
                        </p>
                      </div>

                      <CheckCircle2
                        size={22}
                        className={
                          sessionExercise.completed
                            ? "shrink-0 text-green-500"
                            : "shrink-0 text-zinc-700"
                        }
                      />
                    </div>

                    {prescription.notes && (
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                        <p className="text-xs leading-5 text-zinc-400">
                          {
                            prescription.notes
                          }
                        </p>
                      </div>
                    )}

                    <div className="mt-5 space-y-3">
                      {sessionExercise.sets.map(
                        (set) => (
                          <WorkoutSetRow
                            key={
                              set.id
                            }
                            setId={
                              set.id
                            }
                            setNumber={
                              set.setNumber
                            }
                            executionType={
                              executionType
                            }
                            initialWeightKg={
                              set.weightKg
                            }
                            initialReps={
                              set.reps
                            }
                            initialDurationSeconds={
                              set.durationSeconds
                            }
                            initialDistanceMeters={
                              set.distanceMeters
                            }
                            initialRpe={
                              set.rpe
                            }
                            completed={
                              set.completed
                            }
                            targetRpe={
                              targetRpe
                            }
                            prescribedDurationSeconds={
                              durationSeconds
                            }
                            prescribedDistanceMeters={
                              distanceMeters
                            }
                          />
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {allExercisesCompleted &&
          workoutSession.status ===
            "IN_PROGRESS" && (
            <section className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                  <CheckCircle2
                    size={24}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Treino
                    concluído!
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Você completou
                    todas as séries
                    prescritas para
                    esta sessão.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <FinishWorkoutButton
                  workoutSessionId={
                    workoutSession.id
                  }
                />
              </div>
            </section>
          )}
      </div>
    </main>
  );
}