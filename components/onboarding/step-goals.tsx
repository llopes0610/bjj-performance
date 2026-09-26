import {
  ArrowDown,
  ArrowUp,
  Check,
} from "lucide-react";

import { TRAINING_GOALS } from "@/data/onboarding";
import {
  OnboardingData,
  TrainingGoal,
} from "@/types/onboarding";

interface Props {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
}

export function StepGoals({
  data,
  updateData,
}: Props) {
  function toggleGoal(
    goal: TrainingGoal
  ) {
    const selected =
      data.goals.includes(goal);

    const goals = selected
      ? data.goals.filter(
          (item) => item !== goal
        )
      : [...data.goals, goal];

    updateData({
      goals,
      goalPriorities:
        goals.map(
          (item, index) => ({
            goal: item,
            priority: index + 1,
          })
        ),
    });
  }

  function move(
    index: number,
    direction: -1 | 1
  ) {
    const goals = [...data.goals];

    const target =
      index + direction;

    if (
      target < 0 ||
      target >= goals.length
    ) {
      return;
    }

    [goals[index], goals[target]] = [
      goals[target],
      goals[index],
    ];

    updateData({
      goals,

      goalPriorities:
        goals.map(
          (goal, goalIndex) => ({
            goal,
            priority:
              goalIndex + 1,
          })
        ),
    });
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Seus objetivos
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        O que mais importa para o seu jogo?
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Selecione seus objetivos. Depois
        organize do mais importante para o
        menos importante.
      </p>

      <div className="mt-8 space-y-3">
        {TRAINING_GOALS.map(
          (goal) => {
            const selected =
              data.goals.includes(
                goal.value
              );

            return (
              <button
                key={goal.value}
                type="button"
                onClick={() =>
                  toggleGoal(goal.value)
                }
                className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                    selected
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {selected && (
                    <Check
                      size={15}
                    />
                  )}
                </div>

                <div>
                  <p className="font-semibold">
                    {goal.label}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {
                      goal.description
                    }
                  </p>
                </div>
              </button>
            );
          }
        )}
      </div>

      {data.goals.length > 1 && (
        <div className="mt-10">
          <p className="mb-1 font-semibold">
            Ordem de prioridade
          </p>

          <p className="mb-4 text-sm text-muted">
            1 representa sua maior
            prioridade.
          </p>

          <div className="space-y-2">
            {data.goals.map(
              (goal, index) => {
                const info =
                  TRAINING_GOALS.find(
                    (item) =>
                      item.value === goal
                  );

                return (
                  <div
                    key={goal}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>

                    <span className="flex-1 font-medium">
                      {info?.label}
                    </span>

                    <button
                      type="button"
                      disabled={
                        index === 0
                      }
                      onClick={() =>
                        move(index, -1)
                      }
                      className="rounded-lg p-2 disabled:opacity-20"
                    >
                      <ArrowUp
                        size={17}
                      />
                    </button>

                    <button
                      type="button"
                      disabled={
                        index ===
                        data.goals
                          .length -
                          1
                      }
                      onClick={() =>
                        move(index, 1)
                      }
                      className="rounded-lg p-2 disabled:opacity-20"
                    >
                      <ArrowDown
                        size={17}
                      />
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}