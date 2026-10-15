import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/navigation/app-navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type HistoryLayoutProps = {
  children: ReactNode;
};

export default async function HistoryLayout({
  children,
}: HistoryLayoutProps) {
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