"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { OnboardingProgress } from "./progress";
import { StepBody } from "./step-body";
import { StepBjj } from "./step-bjj";
import { StepSchedule } from "./step-schedule";
import { StepGoals } from "./step-goals";
import { StepRestrictions } from "./step-restrictions";
import { StepPreferences } from "./step-preferences";

import { OnboardingData } from "@/types/onboarding";

const TOTAL_STEPS = 6;

const initialData: OnboardingData = {
  age: null,
  weightKg: null,
  heightCm: null,

  belt: "WHITE",
  beltDegree: 0,

  experience: "BEGINNER",

  giTraining: true,
  noGiTraining: false,

  bjjTrainingDays: [],
  strengthTrainingDays: [],

  sessionDurationMinutes: 60,

  goals: [],
  goalPriorities: [],

  restrictions: [],

  trainingPreferences: [],
};

export function OnboardingForm() {
  const router = useRouter();

  const [step, setStep] =
    useState(1);

  const [data, setData] =
    useState<OnboardingData>(
      initialData
    );

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  function updateData(
    values: Partial<OnboardingData>
  ) {
    setData((current) => ({
      ...current,
      ...values,
    }));
  }

  const validationError =
    useMemo(() => {
      if (step === 1) {
        if (
          !data.age ||
          data.age < 18 ||
          data.age > 100
        ) {
          return "Informe uma idade válida.";
        }

        if (
          !data.weightKg ||
          data.weightKg < 40 ||
          data.weightKg > 300
        ) {
          return "Informe um peso válido.";
        }

        if (
          !data.heightCm ||
          data.heightCm < 130 ||
          data.heightCm > 230
        ) {
          return "Informe uma altura válida.";
        }
      }

      if (step === 2) {
        if (
          !data.giTraining &&
          !data.noGiTraining
        ) {
          return "Selecione Kimono, No-Gi ou ambos.";
        }
      }

      if (step === 3) {
        if (
          data.bjjTrainingDays
            .length === 0
        ) {
          return "Selecione pelo menos um dia de Jiu-Jitsu.";
        }

        if (
          data.strengthTrainingDays
            .length < 2
        ) {
          return "Selecione pelo menos dois dias disponíveis para musculação.";
        }

        if (
          data.strengthTrainingDays
            .length > 4
        ) {
          return "Selecione no máximo quatro dias disponíveis para musculação.";
        }
      }

      if (
        step === 4 &&
        data.goals.length === 0
      ) {
        return "Selecione pelo menos um objetivo.";
      }

      if (step === 5) {
        const incomplete =
          data.restrictions.some(
            (restriction) =>
              !restriction.bodyArea.trim() ||
              !restriction.description.trim()
          );

        if (incomplete) {
          return "Preencha a região e a descrição de todas as restrições adicionadas.";
        }
      }

      return "";
    }, [step, data]);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function nextStep() {
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    setStep((current) =>
      Math.min(
        current + 1,
        TOTAL_STEPS
      )
    );

    scrollToTop();
  }

  function previousStep() {
    setError("");

    setStep((current) =>
      Math.max(current - 1, 1)
    );

    scrollToTop();
  }

  async function finish() {
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/onboarding",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(data),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.error ??
            "Não foi possível salvar seu perfil."
        );

        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Ocorreu um erro ao salvar seu perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <OnboardingProgress
        currentStep={step}
        totalSteps={TOTAL_STEPS}
      />

      <div className="mt-7 sm:mt-10">
        {step === 1 && (
          <StepBody
            data={data}
            updateData={updateData}
          />
        )}

        {step === 2 && (
          <StepBjj
            data={data}
            updateData={updateData}
          />
        )}

        {step === 3 && (
          <StepSchedule
            data={data}
            updateData={updateData}
          />
        )}

        {step === 4 && (
          <StepGoals
            data={data}
            updateData={updateData}
          />
        )}

        {step === 5 && (
          <StepRestrictions
            data={data}
            updateData={updateData}
          />
        )}

        {step === 6 && (
          <StepPreferences
            data={data}
            updateData={updateData}
          />
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-900/50 bg-red-950/40 p-3.5 text-sm leading-5 text-red-300 sm:mt-6 sm:p-4"
        >
          {error}
        </div>
      )}

      <div className="mt-8 border-t border-border pt-5 sm:mt-10 sm:pt-6">
        <div
          className={[
            "grid gap-3",
            step > 1
              ? "grid-cols-[auto_1fr]"
              : "grid-cols-1",
          ].join(" ")}
        >
          {step > 1 && (
            <button
              type="button"
              onClick={previousStep}
              disabled={loading}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3.5"
            >
              <ArrowLeft
                size={18}
                aria-hidden="true"
              />

              <span className="hidden min-[380px]:inline">
                Voltar
              </span>
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white transition active:scale-[0.98] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3.5"
            >
              Continuar

              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white transition active:scale-[0.98] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3.5"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />

                  Salvando...
                </>
              ) : (
                <>
                  <span className="whitespace-nowrap">
                    Criar meu perfil
                  </span>

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}