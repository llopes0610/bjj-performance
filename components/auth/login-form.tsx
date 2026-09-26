"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        setError(
          "E-mail ou senha incorretos."
        );

        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Não foi possível realizar o login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium"
        >
          E-mail
        </label>

        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="voce@email.com"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 outline-none transition focus:border-primary"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium"
        >
          Senha
        </label>

        <div className="relative">
          <input
            id="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Sua senha"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 pr-12 outline-none transition focus:border-primary"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          >
            {showPassword ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-bold transition hover:bg-primary-hover disabled:opacity-60"
      >
        {loading && (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        )}

        {loading
          ? "Entrando..."
          : "Entrar"}
      </button>
    </form>
  );
}