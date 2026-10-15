"use client";

import { useState } from "react";

import {
  CreditCard,
  LoaderCircle,
  Settings,
} from "lucide-react";

interface BillingRedirectButtonProps {
  action: "checkout" | "portal";
  label: string;
  variant?: "primary" | "secondary";
}

/*
 * Pede ao servidor a URL do Stripe (checkout ou portal do
 * cliente) e abre no mesmo navegador.
 */
export function BillingRedirectButton({
  action,
  label,
  variant = "primary",
}: BillingRedirectButtonProps) {
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
        `/api/billing/${action}`,
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

  const Icon =
    action === "checkout"
      ? CreditCard
      : Settings;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={[
          "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary"
            ? "bg-primary text-white hover:bg-primary-hover"
            : "border border-border text-foreground hover:border-primary/40",
        ].join(" ")}
      >
        {loading ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Icon
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
