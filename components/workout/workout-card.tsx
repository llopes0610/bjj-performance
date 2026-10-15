import type { ReactNode } from "react";

import {
  ChevronRight,
  Clock3,
  Dumbbell,
} from "lucide-react";

interface WorkoutCardProps {
  code: string;
  name: string;
  description?: string | null;
  duration: number;
  exerciseCount: number;
  selected?: boolean;

  /**
   * Selo de status (ex.: Concluído).
   * Renderizado no fluxo do layout para não
   * sobrepor o título em telas estreitas.
   */
  badge?: ReactNode;
}

export function WorkoutCard({
  code,
  name,
  description,
  duration,
  exerciseCount,
  selected = false,
  badge,
}: WorkoutCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 transition",
        selected
          ? "border-red-600/50 bg-red-600/5"
          : "border-zinc-800 bg-zinc-900/70",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold",
              selected
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-zinc-300",
            ].join(" ")}
          >
            {code}
          </div>

          <div className="min-w-0">
            {badge && (
              <div className="mb-2">
                {badge}
              </div>
            )}

            <h3 className="font-semibold text-white">
              {name}
            </h3>

            {description && (
              <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
                {description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Clock3 size={14} />
                {duration} min
              </span>

              <span className="flex items-center gap-1.5">
                <Dumbbell size={14} />
                {exerciseCount} exercícios
              </span>
            </div>
          </div>
        </div>

        <ChevronRight
          size={20}
          className="mt-1 shrink-0 text-zinc-600"
        />
      </div>
    </div>
  );
}