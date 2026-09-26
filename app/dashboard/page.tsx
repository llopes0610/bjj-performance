import { redirect } from "next/navigation";

import {
  Dumbbell,
  Flame,
  Medal,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
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

  if (
    !user.onboardingCompleted ||
    !user.athleteProfile
  ) {
    redirect("/onboarding");
  }

  const athlete =
    user.athleteProfile;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl px-5 py-8">
        <header>
          <p className="text-sm text-muted">
            Bem-vindo,
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            {user.name}
          </h1>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Medal />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                Preparação física
              </p>

              <p className="font-bold">
                Nível{" "}
                {athlete.currentLevel}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface p-4">
              <Flame
                size={19}
                className="text-primary"
              />

              <p className="mt-3 text-xl font-bold">
                {
                  athlete.currentStreak
                }
              </p>

              <p className="text-xs text-muted">
                Sequência
              </p>
            </div>

            <div className="rounded-xl bg-surface p-4">
              <Dumbbell
                size={19}
                className="text-primary"
              />

              <p className="mt-3 text-xl font-bold">
                0
              </p>

              <p className="text-xs text-muted">
                Treinos concluídos
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
            Perfil
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              value={`${athlete.weightKg}`}
              label="kg"
            />

            <Metric
              value={`${athlete.heightCm}`}
              label="cm"
            />

            <Metric
              value={`${athlete.bjjDaysPerWeek}x`}
              label="BJJ/sem"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-3 text-center">
      <p className="font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted">
        {label}
      </p>
    </div>
  );
}