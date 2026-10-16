import {
  Plus,
  Trash2,
} from "lucide-react";

import {
  AthleteRestrictionInput,
  OnboardingData,
  RESTRICTION_LIMITS,
} from "@/types/onboarding";

interface Props {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
}

const emptyRestriction: AthleteRestrictionInput =
  {
    bodyArea: "",
    description: "",
    recovered: false,
    medicallyCleared: false,
    currentlyPainful: false,
  };

export function StepRestrictions({
  data,
  updateData,
}: Props) {
  const reachedLimit =
    data.restrictions.length >=
    RESTRICTION_LIMITS.maxItems;

  function addRestriction() {
    if (reachedLimit) {
      return;
    }

    updateData({
      restrictions: [
        ...data.restrictions,
        { ...emptyRestriction },
      ],
    });
  }

  function removeRestriction(
    index: number
  ) {
    updateData({
      restrictions:
        data.restrictions.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    });
  }

  function updateRestriction(
    index: number,
    values: Partial<AthleteRestrictionInput>
  ) {
    const restrictions =
      [...data.restrictions];

    restrictions[index] = {
      ...restrictions[index],
      ...values,
    };

    updateData({
      restrictions,
    });
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Histórico físico
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        Existe algo que devemos considerar?
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Informe lesões atuais ou antigas que
        possam influenciar sua preparação.
      </p>

      {data.restrictions.length ===
        0 && (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5">
          <p className="font-semibold">
            Nenhuma restrição informada
          </p>

          <p className="mt-1 text-sm text-muted">
            Se você não possui histórico
            relevante, pode continuar.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {data.restrictions.map(
          (restriction, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex justify-between">
                <p className="font-semibold">
                  Restrição{" "}
                  {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    removeRestriction(
                      index
                    )
                  }
                  className="text-muted hover:text-red-400"
                >
                  <Trash2
                    size={18}
                  />
                </button>
              </div>

              <input
                value={
                  restriction.bodyArea
                }
                onChange={(event) =>
                  updateRestriction(
                    index,
                    {
                      bodyArea:
                        event.target
                          .value,
                    }
                  )
                }
                placeholder="Região: ex. tíbia, ombro, lombar..."
                maxLength={
                  RESTRICTION_LIMITS.bodyAreaMaxLength
                }
                className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
              />

              <textarea
                value={
                  restriction.description
                }
                onChange={(event) =>
                  updateRestriction(
                    index,
                    {
                      description:
                        event.target
                          .value,
                    }
                  )
                }
                placeholder="Descreva brevemente o histórico"
                maxLength={
                  RESTRICTION_LIMITS.descriptionMaxLength
                }
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
              />

              <div className="mt-4 space-y-3">
                <CheckOption
                  label="Já estou recuperado"
                  checked={
                    restriction.recovered
                  }
                  onChange={(value) =>
                    updateRestriction(
                      index,
                      {
                        recovered:
                          value,
                      }
                    )
                  }
                />

                <CheckOption
                  label="Estou liberado para atividade física"
                  checked={
                    restriction.medicallyCleared
                  }
                  onChange={(value) =>
                    updateRestriction(
                      index,
                      {
                        medicallyCleared:
                          value,
                      }
                    )
                  }
                />

                <CheckOption
                  label="Sinto dor atualmente nessa região"
                  checked={
                    restriction.currentlyPainful
                  }
                  onChange={(value) =>
                    updateRestriction(
                      index,
                      {
                        currentlyPainful:
                          value,
                      }
                    )
                  }
                />
              </div>
            </div>
          )
        )}
      </div>

      <button
        type="button"
        onClick={addRestriction}
        disabled={reachedLimit}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 font-semibold text-muted transition hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted"
      >
        <Plus size={18} />
        Adicionar histórico
      </button>

      {reachedLimit && (
        <p className="mt-2 text-center text-xs text-muted">
          Limite de{" "}
          {RESTRICTION_LIMITS.maxItems}{" "}
          registros atingido.
        </p>
      )}
    </div>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-4 w-4 accent-red-600"
      />

      {label}
    </label>
  );
}