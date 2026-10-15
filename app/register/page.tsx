import Link from "next/link";

import {
  Dumbbell,
  ShieldCheck,
} from "lucide-react";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-6 sm:px-6 sm:py-10">
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-primary"
          >
            <Dumbbell size={20} />

            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              BJJ Performance
            </span>
          </Link>
        </div>

        <section className="flex-1">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={24} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Comece sua evolução.
            </h1>

            <p className="mt-3 leading-6 text-muted">
              Crie sua conta e monte uma
              preparação física adaptada ao
              seu Jiu-Jitsu.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-muted">
            Já possui uma conta?{" "}

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center font-semibold text-foreground"
            >
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}