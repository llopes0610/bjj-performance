interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const percentage =
    (currentStep / totalSteps) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          Etapa {currentStep} de {totalSteps}
        </span>

        <span className="text-muted">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}