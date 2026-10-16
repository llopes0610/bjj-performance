import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { fulfillCheckoutSession } from "@/lib/billing/fulfill-checkout";
import { userHasAccess } from "@/lib/billing/get-access";
import { prisma } from "@/lib/prisma";

interface BillingSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

/*
 * Retorno do Checkout. Registra a compra na hora (sem
 * esperar o webhook), aceitando só a sessão do próprio
 * usuário logado. O webhook faz o mesmo registro; os dois
 * juntos resultam em uma única compra.
 */
export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { session_id: checkoutSessionId } =
    await searchParams;

  const user =
    await prisma.user.findUnique({
      where: {
        email:
          session.user.email,
      },

      select: {
        id: true,
        onboardingCompleted:
          true,
      },
    });

  if (!user) {
    redirect("/login");
  }

  if (
    checkoutSessionId &&
    /^cs_[A-Za-z0-9_]+$/.test(
      checkoutSessionId
    )
  ) {
    try {
      const result =
        await fulfillCheckoutSession(
          checkoutSessionId,
          {
            expectedUserId: user.id,
          }
        );

      if (result.status === "rejected") {
        console.warn(
          "BILLING_SUCCESS_REJECTED",
          checkoutSessionId,
          result.reason
        );
      }
    } catch (error) {
      // O webhook ainda vai registrar a compra.
      console.error(
        "BILLING_SUCCESS_FULFILL_ERROR",
        error instanceof Error
          ? error.message
          : error
      );
    }
  }

  const active =
    await userHasAccess(
      session.user.email
    );

  const nextHref =
    user.onboardingCompleted
      ? "/dashboard"
      : "/onboarding";

  return (
    <main className="flex min-h-dvh items-center bg-background px-4 text-foreground">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <div
          className={[
            "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
            active
              ? "bg-green-500/10 text-green-400"
              : "bg-yellow-500/10 text-yellow-400",
          ].join(" ")}
        >
          {active ? (
            <CheckCircle2
              size={28}
              aria-hidden="true"
            />
          ) : (
            <Clock3
              size={28}
              aria-hidden="true"
            />
          )}
        </div>

        <h1 className="mt-5 text-xl font-bold">
          {active
            ? "Acesso liberado"
            : "Confirmando pagamento..."}
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          {active
            ? "Compra confirmada. Bons treinos!"
            : "O Stripe ainda está confirmando seu pagamento. Isso costuma levar poucos segundos."}
        </p>

        {active ? (
          <Link
            href={nextHref}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            {user.onboardingCompleted
              ? "Ir para o BJJ Performance"
              : "Montar meu perfil"}
            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>
        ) : (
          <Link
            href={
              checkoutSessionId
                ? `/billing/success?session_id=${encodeURIComponent(checkoutSessionId)}`
                : "/plans"
            }
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl border border-border px-5 py-3 font-semibold transition hover:border-primary/40"
          >
            Verificar novamente
          </Link>
        )}
      </div>
    </main>
  );
}
