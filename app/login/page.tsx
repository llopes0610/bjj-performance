import Link from "next/link";

import {
  Dumbbell,
  LogIn,
} from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-12 inline-flex min-h-11 items-center gap-2 text-primary"
        >
          <Dumbbell size={20} />

          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            BJJ Performance
          </span>
        </Link>

        <section>
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LogIn size={23} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Bem-vindo de volta.
            </h1>

            <p className="mt-3 text-muted">
              Entre para continuar sua
              preparação.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-muted">
            Ainda não possui conta?{" "}

            <Link
              href="/register"
              className="inline-flex min-h-11 items-center font-semibold text-foreground"
            >
              Criar conta
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}