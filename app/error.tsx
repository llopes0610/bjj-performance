"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  Dumbbell,
  RotateCcw,
} from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

/*
 * Erro inesperado em qualquer página. O detalhe fica
 * no console/log do servidor; o atleta vê só uma
 * mensagem e a opção de tentar de novo.
 */
export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    console.error("PAGE_ERROR", error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 self-start text-primary"
        >
          <Dumbbell
            size={20}
            aria-hidden="true"
          />

          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            BJJ Performance
          </span>
        </Link>

        <section className="flex flex-1 flex-col justify-center py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Algo deu errado
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Não foi possível carregar
            esta página.
          </h1>

          <p className="mt-3 leading-6 text-muted">
            Seus treinos registrados estão
            salvos. Tente novamente em alguns
            instantes.
          </p>

          <button
            type="button"
            onClick={() =>
              reset
                ? reset()
                : window.location.reload()
            }
            className="mt-8 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
          >
            <RotateCcw
              size={18}
              aria-hidden="true"
            />
            Tentar novamente
          </button>

          <Link
            href="/dashboard"
            className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-border px-5 py-3 font-semibold transition hover:bg-card"
          >
            Voltar ao início
          </Link>
        </section>
      </div>
    </main>
  );
}
