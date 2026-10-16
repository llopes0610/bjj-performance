"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LoaderCircle,
  Sparkles,
} from "lucide-react";

interface GenerateProgramButtonProps {
  label?: string;
  className?: string;
  onGenerated?: () => void;
}

/*
 * Gera o programa pelo endpoint existente
 * (/api/training-program/generate) e leva o atleta
 * para a tela de treino.
 */
export function GenerateProgramButton({
  label = "Gerar meu programa",
  className,
  onGenerated,
}: GenerateProgramButtonProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  async function handleGenerate() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/training-program/generate",
        {
          method: "POST",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Não foi possível gerar o programa."
        );
      }

      onGenerated?.();

      router.push("/workout");
      router.refresh();
    } catch (error) {
      console.error(
        "GENERATE_PROGRAM_CLIENT_ERROR",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o programa."
      );

      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? (
          <>
            <LoaderCircle
              size={18}
              className="animate-spin"
              aria-hidden="true"
            />

            Gerando programa...
          </>
        ) : (
          <>
            <Sparkles
              size={18}
              aria-hidden="true"
            />

            {label}
          </>
        )}
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
