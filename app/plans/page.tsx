import { redirect } from "next/navigation";

import {
  Check,
  Dumbbell,
} from "lucide-react";

import { CheckoutButton } from "@/components/billing/checkout-button";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { auth } from "@/lib/auth";
import { userHasAccess } from "@/lib/billing/get-access";
import {
  getOfferPriceLabel,
  PRODUCT_OFFER,
} from "@/lib/billing/plan";

export default async function PlansPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  /*
   * Quem já comprou não volta para a oferta.
   */
  if (
    await userHasAccess(
      session.user.email
    )
  ) {
    redirect("/dashboard");
  }

  const priceLabel =
    await getOfferPriceLabel();

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
          Libere seu acesso
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          Preparação física feita para o
          Jiu-Jitsu, com programa
          individual e progressão semanal.
        </p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-primary">
            {PRODUCT_OFFER.name}
          </p>

          <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
            {priceLabel && (
              <span className="text-3xl font-bold">
                {priceLabel}
              </span>
            )}

            <span className="text-sm text-muted">
              {PRODUCT_OFFER.paymentLabel}
            </span>
          </p>

          <ul className="mt-5 space-y-3">
            {PRODUCT_OFFER.features.map(
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
            <CheckoutButton />
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-muted">
            Pagamento seguro pelo Stripe.
            Você paga uma vez e o acesso
            fica liberado.
          </p>
        </section>

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
