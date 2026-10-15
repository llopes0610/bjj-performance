import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { AppNavigation } from "@/components/navigation/app-navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { OnboardingData } from "@/types/onboarding";

export default async function EditProfilePage() {
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
        name: true,
        onboardingCompleted:
          true,

        athleteProfile: {
          include: {
            goalPriorities: {
              orderBy: {
                priority: "asc",
              },
            },

            restrictions: {
              orderBy: {
                createdAt: "asc",
              },
            },
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

  const athlete =
    user.athleteProfile;

  /*
   * Os dados atuais preenchem o mesmo formulário do
   * onboarding. Ao salvar, a API substitui o perfil
   * (upsert), as prioridades e as restrições.
   */
  const initialValues: OnboardingData = {
    age: athlete.age,
    weightKg: athlete.weightKg,
    heightCm: athlete.heightCm,

    belt: athlete.belt,
    beltDegree: athlete.beltDegree,

    experience: athlete.experience,

    giTraining: athlete.giTraining,
    noGiTraining:
      athlete.noGiTraining,

    bjjTrainingDays:
      athlete.bjjTrainingDays,
    strengthTrainingDays:
      athlete.strengthTrainingDays,

    sessionDurationMinutes:
      athlete.sessionDurationMinutes,

    goals: athlete.goals,

    goalPriorities:
      athlete.goalPriorities.map(
        (item) => ({
          goal: item.goal,
          priority: item.priority,
        })
      ),

    restrictions:
      athlete.restrictions.map(
        (item) => ({
          bodyArea: item.bodyArea,
          description:
            item.description,
          recovered: item.recovered,
          medicallyCleared:
            item.medicallyCleared,
          currentlyPainful:
            item.currentlyPainful,
        })
      ),

    trainingPreferences:
      athlete.trainingPreferences,
  };

  return (
    <AppNavigation
      athleteName={
        user.name ||
        session.user.name ||
        "Atleta"
      }
    >
      <main className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-5 sm:px-6 sm:pt-10 lg:pb-12">
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />
            Voltar ao perfil
          </Link>

          <header className="mb-7 mt-4 sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Perfil do atleta
            </p>

            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Editar perfil
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Atualize seus dados.
              Mudanças de agenda,
              objetivos ou restrições
              podem pedir um novo
              programa.
            </p>
          </header>

          <OnboardingForm
            mode="edit"
            initialValues={
              initialValues
            }
          />
        </div>
      </main>
    </AppNavigation>
  );
}
