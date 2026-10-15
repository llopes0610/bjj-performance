import Link from "next/link";

import { notFound, redirect } from "next/navigation";

import {
  ArrowLeft,
  Clock3,
  Dumbbell,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ExerciseVideo } from "@/components/workout/exercise-video";

interface ExercisePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExercisePage({
  params,
}: ExercisePageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const prescription =
    await prisma.workoutExercise.findFirst({
      where: {
        id,

        workout: {
          program: {
            athlete: {
              user: {
                email:
                  session.user.email,
              },
            },
          },
        },
      },

      include: {
        exercise: true,

        workout: {
          include: {
            program: true,
          },
        },
      },
    });

  if (!prescription) {
    notFound();
  }

  const exercise =
    prescription.exercise;

  return (
    <main className="min-h-dvh bg-[#09090b] text-white">
      <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-6 sm:px-6 sm:py-10">
        <Link
          href="/workout"
          className="mb-6 inline-flex min-h-11 items-center sm:mb-8 gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar ao treino
        </Link>

        <header className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            {
              prescription.workout
                .name
            }
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {exercise.name}
          </h1>

          {exercise.description && (
            <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
              {exercise.description}
            </p>
          )}
        </header>

        <ExerciseVideo
          videoUrl={
            exercise.videoUrl
          }
          thumbnailUrl={
            exercise.thumbnailUrl
          }
          exerciseName={
            exercise.name
          }
        />

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Séries"
            value={String(
              prescription.sets
            )}
          />

          <Metric
            label="Repetições"
            value={
              prescription.repsMin &&
              prescription.repsMax
                ? `${prescription.repsMin}–${prescription.repsMax}`
                : prescription.durationSeconds
                  ? `${prescription.durationSeconds}s`
                  : prescription.distanceMeters
                    ? `${prescription.distanceMeters}m`
                    : "-"
            }
          />

          <Metric
            label="RPE"
            value={
              prescription.targetRpe
                ? String(
                    prescription.targetRpe
                  )
                : "-"
            }
          />

          <Metric
            label="Descanso"
            value={`${prescription.restSeconds}s`}
            icon={<Clock3 size={15} />}
          />
        </section>

        <div className="mt-8 space-y-4 sm:mt-10 sm:space-y-6">
          <InfoSection
            icon={
              <Dumbbell size={19} />
            }
            title="Como executar"
          >
            <ol className="space-y-3">
              {exercise.instructions.map(
                (instruction, index) => (
                  <li
                    key={`${instruction}-${index}`}
                    className="flex gap-3 text-sm leading-6 text-zinc-300"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
                      {index + 1}
                    </span>

                    {instruction}
                  </li>
                )
              )}
            </ol>
          </InfoSection>

          {exercise.bjjTransfer && (
            <InfoSection
              icon={
                <Target size={19} />
              }
              title="Transferência para o Jiu-Jitsu"
            >
              <p className="text-sm leading-7 text-zinc-300">
                {
                  exercise.bjjTransfer
                }
              </p>
            </InfoSection>
          )}

          {exercise.commonErrors.length >
            0 && (
            <InfoSection
              icon={
                <TriangleAlert
                  size={19}
                />
              }
              title="Erros que você deve evitar"
            >
              <ul className="space-y-3">
                {exercise.commonErrors.map(
                  (error, index) => (
                    <li
                      key={`${error}-${index}`}
                      className="flex gap-3 text-sm leading-6 text-zinc-300"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

                      {error}
                    </li>
                  )
                )}
              </ul>
            </InfoSection>
          )}

          <InfoSection
            icon={
              <ShieldCheck size={19} />
            }
            title="Prescrição"
          >
            <p className="text-sm leading-7 text-zinc-300">
              Execute{" "}
              <strong>
                {prescription.sets} séries
              </strong>
              {prescription.repsMin &&
              prescription.repsMax
                ? ` de ${prescription.repsMin} a ${prescription.repsMax} repetições`
                : ""}
              {prescription.targetRpe
                ? ` em aproximadamente RPE ${prescription.targetRpe}`
                : ""}
              . Descanse{" "}
              {prescription.restSeconds}{" "}
              segundos entre as séries.
            </p>

            {prescription.notes && (
              <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-400">
                {prescription.notes}
              </p>
            )}
          </InfoSection>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <span className="text-xs text-zinc-500">
        {label}
      </span>

      <div className="mt-2 flex items-center gap-2">
        {icon && (
          <span className="text-red-500">
            {icon}
          </span>
        )}

        <strong className="text-lg">
          {value}
        </strong>
      </div>
    </div>
  );
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:rounded-3xl sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-red-500">
          {icon}
        </span>

        <h2 className="font-semibold">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}