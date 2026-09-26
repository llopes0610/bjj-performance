import {
  Belt,
  OnboardingData,
  TrainingExperience,
} from "@/types/onboarding";

interface Props {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
}

const belts: {
  value: Belt;
  label: string;
}[] = [
  { value: "WHITE", label: "Branca" },
  { value: "BLUE", label: "Azul" },
  { value: "PURPLE", label: "Roxa" },
  { value: "BROWN", label: "Marrom" },
  { value: "BLACK", label: "Preta" },
];

const experiences: {
  value: TrainingExperience;
  label: string;
  description: string;
}[] = [
  {
    value: "BEGINNER",
    label: "Iniciante",
    description:
      "Ainda construindo base técnica e física.",
  },
  {
    value: "INTERMEDIATE",
    label: "Intermediário",
    description:
      "Já treino regularmente e conheço bem meu corpo.",
  },
  {
    value: "ADVANCED",
    label: "Avançado",
    description:
      "Treino consistente e maior tolerância ao volume.",
  },
];

export function StepBjj({
  data,
  updateData,
}: Props) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Seu Jiu-Jitsu
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        Como é o seu jogo hoje?
      </h2>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium">
          Graduação
        </p>

        <div className="grid grid-cols-2 gap-3">
          {belts.map((belt) => (
            <button
              key={belt.value}
              type="button"
              onClick={() =>
                updateData({
                  belt: belt.value,
                  beltDegree: 0,
                })
              }
              className={`rounded-xl border p-4 text-left transition ${
                data.belt === belt.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
            >
              <span className="font-semibold">
                Faixa {belt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-sm font-medium">
          Grau
        </p>

        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(
            (degree) => (
              <button
                key={degree}
                type="button"
                onClick={() =>
                  updateData({
                    beltDegree: degree,
                  })
                }
                className={`flex h-11 flex-1 items-center justify-center rounded-xl border font-semibold transition ${
                  data.beltDegree ===
                  degree
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface"
                }`}
              >
                {degree}
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-sm font-medium">
          Experiência física
        </p>

        <div className="space-y-3">
          {experiences.map(
            (experience) => (
              <button
                key={experience.value}
                type="button"
                onClick={() =>
                  updateData({
                    experience:
                      experience.value,
                  })
                }
                className={`w-full rounded-xl border p-4 text-left transition ${
                  data.experience ===
                  experience.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <p className="font-semibold">
                  {experience.label}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {
                    experience.description
                  }
                </p>
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-sm font-medium">
          Modalidade
        </p>

        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            label="Kimono"
            selected={data.giTraining}
            onClick={() =>
              updateData({
                giTraining:
                  !data.giTraining,
              })
            }
          />

          <ToggleCard
            label="No-Gi"
            selected={data.noGiTraining}
            onClick={() =>
              updateData({
                noGiTraining:
                  !data.noGiTraining,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

function ToggleCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 font-semibold transition ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-surface"
      }`}
    >
      {label}
    </button>
  );
}