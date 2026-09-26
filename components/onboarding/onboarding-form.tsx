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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousStep() {
    setError("");

    setStep((current) =>
      Math.max(current - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
    <div>
      <OnboardingProgress
        currentStep={step}
        totalSteps={TOTAL_STEPS}
      />

      <div className="mt-10">
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
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-10 flex gap-3 border-t border-border pt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={previousStep}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3.5 font-semibold"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold transition hover:bg-primary-hover"
          >
            Continuar
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Salvando...
              </>
            ) : (
              <>
                Criar meu perfil
                <ArrowRight
                  size={18}
                />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}