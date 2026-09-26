import {
  Check,
  Dumbbell,
} from "lucide-react";

import {
  OnboardingData,
  TrainingPreference,
} from "@/types/onboarding";

interface Props {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
}

const preferences: {
  value: TrainingPreference;
  label: string;
  description: string;
}[] = [
  {
    value: "AVOID_BARBELL",
    label: "Evitar barra livre",
    description:
      "Priorizar máquinas, halteres e cabos.",
  },
  {
    value: "AVOID_HIGH_IMPACT",
    label: "Evitar alto impacto",
    description:
      "Reduzir saltos e exercícios de impacto.",
  },
  {
    value: "PREFER_MACHINES",
    label: "Prefiro máquinas",
    description:
      "Dar preferência a equipamentos guiados.",
  },
  {
    value: "PREFER_DUMBBELLS",
    label: "Prefiro halteres",
    description:
      "Utilizar halteres quando houver alternativa.",
  },
  {
    value: "PREFER_CABLES",
    label: "Prefiro cabos",
    description:
      "Priorizar exercícios em polias.",
  },
  {
    value: "PREFER_BODYWEIGHT",
    label: "Prefiro peso corporal",
    description:
      "Usar mais exercícios com o próprio corpo.",
  },
];

export function StepPreferences({
  data,
  updateData,
}: Props) {
  function toggle(
    preference: TrainingPreference
  ) {
    const selected =
      data.trainingPreferences.includes(
        preference
      );

    updateData({
      trainingPreferences:
        selected
          ? data.trainingPreferences.filter(
              (item) =>
                item !== preference
            )
          : [
              ...data.trainingPreferences,
              preference,
            ],
    });
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Última etapa
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        Como você prefere treinar?
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Essas preferências ajudam o sistema a
        escolher alternativas compatíveis com
        você e sua academia.
      </p>

      <div className="mt-8 space-y-3">
        {preferences.map(
          (preference) => {
            const selected =
              data.trainingPreferences.includes(
                preference.value
              );

            return (
              <button
                key={
                  preference.value
                }
                type="button"
                onClick={() =>
                  toggle(
                    preference.value
                  )
                }
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                  <Dumbbell
                    size={19}
                  />
                </div>

                <div className="flex-1">
                  <p className="font-semibold">
                    {
                      preference.label
                    }
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {
                      preference.description
                    }
                  </p>
                </div>

                {selected && (
                  <Check
                    size={20}
                    className="text-primary"
                  />
                )}
              </button>
            );
          }
        )}
      </div>

      <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="font-semibold">
          Tudo pronto.
        </p>

        <p className="mt-1 text-sm leading-6 text-muted">
          O próximo passo será usar seu
          perfil para definir sua preparação
          física.
        </p>
      </div>
    </div>
  );
}