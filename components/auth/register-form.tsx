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

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

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
      const response = await fetch(
        "/api/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Não foi possível criar sua conta."
        );

        return;
      }

      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError(
        "Ocorreu um erro inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-4"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium"
        >
          Nome
        </label>

        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          enterKeyHint="next"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          placeholder="Seu nome"
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

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
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          enterKeyHint="next"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="voce@email.com"
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
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
            minLength={8}
            autoComplete="new-password"
            enterKeyHint="done"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Mínimo 8 caracteres"
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 pr-14 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) =>
                  !current
              )
            }
            aria-label={
              showPassword
                ? "Ocultar senha"
                : "Mostrar senha"
            }
            aria-pressed={
              showPassword
            }
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-white/5 hover:text-white active:scale-95"
          >
            {showPassword ? (
              <EyeOff
                size={20}
                aria-hidden="true"
              />
            ) : (
              <Eye
                size={20}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted">
          Use pelo menos 8 caracteres.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/40 p-3.5 text-sm leading-5 text-red-300"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-bold text-white transition active:scale-[0.99] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        )}

        {loading
          ? "Criando conta..."
          : "Criar minha conta"}
      </button>
    </form>
  );
}