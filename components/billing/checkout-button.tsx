"use client";

import { useState } from "react";

import {
  CreditCard,
  LoaderCircle,
} from "lucide-react";

interface CheckoutButtonProps {
  label?: string;
}

/*
 * Pede ao servidor a URL do Checkout do Stripe (compra
 * única) e abre no mesmo navegador.
 */
export function CheckoutButton({
  label = "Comprar acesso",
}: CheckoutButtonProps) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/billing/checkout",
        {
          method: "POST",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error ??
            "Não foi possível abrir o pagamento."
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o pagamento."
      );

      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        ) : (
          <CreditCard
            size={18}
            aria-hidden="true"
          />
        )}

        {loading
          ? "Abrindo..."
          : label}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
