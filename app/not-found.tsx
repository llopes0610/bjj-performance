import Link from "next/link";

import {
  ArrowLeft,
  Dumbbell,
} from "lucide-react";

export default function NotFound() {
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
            Erro 404
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Página não encontrada.
          </h1>

          <p className="mt-3 leading-6 text-muted">
            O endereço pode estar errado ou
            esse conteúdo não está disponível
            para a sua conta.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
          >
            <ArrowLeft
              size={18}
              aria-hidden="true"
            />
            Voltar ao início
          </Link>
        </section>
      </div>
    </main>
  );
}
