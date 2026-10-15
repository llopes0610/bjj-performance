import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Check,
  Dumbbell,
} from "lucide-react";

import { BillingRedirectButton } from "@/components/billing/billing-redirect-button";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { auth } from "@/lib/auth";
import { userHasAccess } from "@/lib/billing/get-access";
import { MONTHLY_PLAN } from "@/lib/billing/plan";

export default async function PlansPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const hasAccess =
    await userHasAccess(
      session.user.email
    );

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 pb-12 pt-6 sm:px-6 sm:py-12">
        <header className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Dumbbell
              size={19}
              aria-hidden="true"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.18em]">
            BJJ Performance
          </p>
        </header>

        <h1 className="mt-8 text-2xl font-bold sm:text-3xl">
          {hasAccess
            ? "Sua assinatura está ativa"
            : "Assine para treinar"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          {hasAccess
            ? "Você já tem acesso completo ao BJJ Performance."
            : "Preparação física feita para o Jiu-Jitsu, com programa individual e progressão semanal."}
        </p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-primary">
            {MONTHLY_PLAN.name}
          </p>

          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {MONTHLY_PLAN.priceLabel}
            </span>

            <span className="text-sm text-muted">
              {MONTHLY_PLAN.periodLabel}
            </span>
          </p>

          <ul className="mt-5 space-y-3">
            {MONTHLY_PLAN.features.map(
              (feature) => (
                <li
                  key={feature}
                  className="flex gap-2.5 text-sm leading-6"
                >
                  <Check
                    size={18}
                    className="mt-0.5 shrink-0 text-green-500"
                    aria-hidden="true"
                  />

                  {feature}
                </li>
              )
            )}
          </ul>

          <div className="mt-6">
            {hasAccess ? (
              <Link
                href="/dashboard"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover"
              >
                Ir para o app
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <BillingRedirectButton
                action="checkout"
                label="Assinar agora"
              />
            )}
          </div>

          {!hasAccess && (
            <p className="mt-3 text-center text-xs leading-5 text-muted">
              Pagamento seguro pelo Stripe,
              no cartão de crédito. Cancele
              quando quiser pelo seu perfil.
            </p>
          )}
        </section>

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
