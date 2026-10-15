"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

interface AdvanceWeekButtonProps {
  currentWeek: number;
  durationWeeks: number;
}

export function AdvanceWeekButton({
  currentWeek,
  durationWeeks,
}: AdvanceWeekButtonProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  async function handleAdvanceWeek() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/training-program/advance-week",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Não foi possível avançar a semana."
        );
      }

      router.refresh();
    } catch (error) {
      console.error(
        "ADVANCE_WEEK_CLIENT_ERROR",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível avançar a semana."
      );
    } finally {
      setLoading(false);
    }
  }

  const nextWeek =
    currentWeek + 1;

  return (
    <div>
      <button
        type="button"
        onClick={handleAdvanceWeek}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <LoaderCircle
              size={19}
              className="animate-spin"
            />

            Preparando semana...
          </>
        ) : (
          <>
            Iniciar semana {nextWeek}

            <ArrowRight size={19} />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-zinc-600">
        Semana {currentWeek} de{" "}
        {durationWeeks} concluída
      </p>

      {error && (
        <p className="mt-3 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}