import { WEEK_DAYS } from "@/data/onboarding";
import {
  OnboardingData,
  WeekDay,
} from "@/types/onboarding";

interface Props {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
}

export function StepSchedule({
  data,
  updateData,
}: Props) {
  function toggleDay(
    field:
      | "bjjTrainingDays"
      | "strengthTrainingDays",
    day: WeekDay
  ) {
    const current = data[field];

    const next = current.includes(day)
      ? current.filter(
          (item) => item !== day
        )
      : [...current, day];

    updateData({
      [field]: next,
    });
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Sua semana
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        Quando você treina?
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Vamos distribuir força e recuperação
        em torno do Jiu-Jitsu.
      </p>

      <DaySelector
        title="Dias de Jiu-Jitsu"
        days={data.bjjTrainingDays}
        onToggle={(day) =>
          toggleDay(
            "bjjTrainingDays",
            day
          )
        }
      />

      <DaySelector
        title="Dias disponíveis para musculação"
        days={
          data.strengthTrainingDays
        }
        onToggle={(day) =>
          toggleDay(
            "strengthTrainingDays",
            day
          )
        }
      />

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium">
          Tempo disponível por treino
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[45, 60, 75].map(
            (minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() =>
                  updateData({
                    sessionDurationMinutes:
                      minutes,
                  })
                }
                className={`rounded-xl border py-4 font-semibold transition ${
                  data.sessionDurationMinutes ===
                  minutes
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface"
                }`}
              >
                {minutes} min
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function DaySelector({
  title,
  days,
  onToggle,
}: {
  title: string;
  days: WeekDay[];
  onToggle: (day: WeekDay) => void;
}) {
  return (
    <div className="mt-8">
      <p className="mb-3 text-sm font-medium">
        {title}
      </p>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {WEEK_DAYS.map((day) => {
          const selected =
            days.includes(day.value);

          return (
            <button
              key={day.value}
              type="button"
              onClick={() =>
                onToggle(day.value)
              }
              className={`rounded-xl border py-3 text-xs font-bold transition ${
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted"
              }`}
            >
              {day.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}