"use client";

import {
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  PostWorkoutFeedback,
  type PostWorkoutFeedbackData,
} from "./post-workout-feedback";

interface FinishWorkoutButtonProps {
  workoutSessionId: string;
}

export function FinishWorkoutButton({
  workoutSessionId,
}: FinishWorkoutButtonProps) {
  const router = useRouter();

  const [
    showFeedback,
    setShowFeedback,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  function openFeedback() {
    setError(null);

    setShowFeedback(true);

    /*
     * Como a tela pode ser longa,
     * esperamos a renderização do
     * formulário antes de rolar.
     */
    window.setTimeout(() => {
      document
        .getElementById(
          "post-workout-feedback"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  async function handleFinish(
    feedback:
      PostWorkoutFeedbackData
  ) {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response =
        await fetch(
          "/api/workout/finish",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                workoutSessionId,

                sessionRpe:
                  feedback.sessionRpe,

                postWorkoutFeeling:
                  feedback.postWorkoutFeeling,

                hasPain:
                  feedback.hasPain,

                painRegion:
                  feedback.painRegion,

                painIntensity:
                  feedback.painIntensity,

                painNotes:
                  feedback.painNotes,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Não foi possível finalizar o treino."
        );
      }

      router.push(
        `/workout/session/${workoutSessionId}/completed`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "FINISH_WORKOUT_CLIENT_ERROR",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o treino."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * PRIMEIRO ESTADO:
   *
   * O atleta terminou todas as séries,
   * mas ainda não respondeu ao
   * feedback pós-treino.
   */
  if (!showFeedback) {
    return (
      <div>
        <button
          type="button"
          onClick={
            openFeedback
          }
          className="flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 font-semibold text-white transition active:scale-[0.99] hover:bg-green-500"
        >
          <CheckCircle2
            size={20}
            aria-hidden="true"
          />

          Concluir treino

          <ChevronDown
            size={18}
            aria-hidden="true"
          />
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
          Depois, conte rapidamente
          como foi o treino.
        </p>
      </div>
    );
  }

  /*
   * SEGUNDO ESTADO:
   *
   * Exibimos o feedback.
   *
   * Somente o botão interno
   * "Finalizar treino" fará a
   * chamada para a API.
   */
  return (
    <div
      id="post-workout-feedback"
      className="scroll-mt-6"
    >
      <PostWorkoutFeedback
        loading={loading}
        onSubmit={
          handleFinish
        }
      />

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-sm leading-5 text-red-300"
        >
          {error}
        </div>
      )}
    </div>
  );
}