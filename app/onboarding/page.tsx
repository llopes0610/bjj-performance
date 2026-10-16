import { redirect } from "next/navigation";

import { Dumbbell } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userHasAccess } from "@/lib/billing/get-access";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
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
      },
    });

  if (user?.onboardingCompleted) {
    redirect("/dashboard");
  }

  /*
   * Só pago: sem compra confirmada, o atleta vai para
   * a página de compra (/plans).
   */
  if (
    !(await userHasAccess(
      session.user.email
    ))
  ) {
    redirect("/plans");
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-6 sm:px-6 sm:py-12">
        <header className="mb-8 flex items-center gap-2 sm:mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Dumbbell size={19} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]">
              BJJ Performance
            </p>

            <p className="text-xs text-muted">
              Perfil do atleta
            </p>
          </div>
        </header>

        <OnboardingForm />
      </div>
    </main>
  );
}