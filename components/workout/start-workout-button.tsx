"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dumbbell,
  LoaderCircle,
} from "lucide-react";

interface StartWorkoutButtonProps {
  workoutId: string;
}

export function StartWorkoutButton({
  workoutId,
}: StartWorkoutButtonProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  async function handleStartWorkout() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/workout/start",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            workoutId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Não foi possível iniciar o treino."
        );
      }

      if (!data?.sessionId) {
        throw new Error(
          "A sessão de treino não foi retornada."
        );
      }

      router.push(
        `/workout/session/${data.sessionId}`
      );
    } catch (error) {
      console.error(
        "START_WORKOUT_CLIENT_ERROR",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o treino."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleStartWorkout}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <LoaderCircle
              size={20}
              className="animate-spin"
            />

            Iniciando treino...
          </>
        ) : (
          <>
            <Dumbbell size={20} />

            Iniciar treino
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}