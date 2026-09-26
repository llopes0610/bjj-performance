import { OnboardingData } from "@/types/onboarding";

interface StepBodyProps {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
}

export function StepBody({
  data,
  updateData,
}: StepBodyProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Sobre você
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        Vamos começar pelo básico.
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted">
        Esses dados ajudam a calibrar volume,
        recuperação e progressão.
      </p>

      <div className="mt-8 space-y-5">
        <NumberField
          label="Idade"
          value={data.age}
          suffix="anos"
          min={18}
          max={100}
          onChange={(value) =>
            updateData({ age: value })
          }
        />

        <NumberField
          label="Peso"
          value={data.weightKg}
          suffix="kg"
          min={40}
          max={300}
          step={0.1}
          onChange={(value) =>
            updateData({
              weightKg: value,
            })
          }
        />

        <NumberField
          label="Altura"
          value={data.heightCm}
          suffix="cm"
          min={130}
          max={230}
          onChange={(value) =>
            updateData({
              heightCm: value,
            })
          }
        />
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number | null;
  suffix: string;
  min: number;
  max: number;
  step?: number;
  onChange: (
    value: number | null
  ) => void;
}

function NumberField({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(event) => {
            const raw =
              event.target.value;

            onChange(
              raw === ""
                ? null
                : Number(raw)
            );
          }}
          className="w-full rounded-xl border border-border bg-surface px-4 py-4 pr-16 text-lg font-semibold outline-none transition focus:border-primary"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
          {suffix}
        </span>
      </div>
    </label>
  );
}