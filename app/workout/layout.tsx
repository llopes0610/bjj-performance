import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/navigation/app-navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userHasAccess } from "@/lib/billing/get-access";

type WorkoutLayoutProps = {
  children: ReactNode;
};

export default async function WorkoutLayout({
  children,
}: WorkoutLayoutProps) {
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
        name: true,

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
    <AppNavigation
      athleteName={
        user.name ||
        session.user.name ||
        "Atleta"
      }
    >
      <div className="pb-20 lg:pb-0">
        {children}
      </div>
    </AppNavigation>
  );
}