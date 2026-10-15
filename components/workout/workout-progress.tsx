interface WorkoutProgressProps {
  currentWeek: number;
  durationWeeks: number;
}

export function WorkoutProgress({
  currentWeek,
  durationWeeks,
}: WorkoutProgressProps) {
  const progress = Math.min(
    100,
    Math.max(
      0,
      (currentWeek / durationWeeks) * 100
    )
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          Progresso do programa
        </span>

        <span className="font-medium text-white">
          Semana {currentWeek} de {durationWeeks}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-red-600 transition-all"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}