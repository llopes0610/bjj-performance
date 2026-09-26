export interface FoundationExercisePrescription {
  slug: string;

  block:
    | "ACTIVATION"
    | "MAIN"
    | "ACCESSORY"
    | "CORE"
    | "GRIP"
    | "CONDITIONING"
    | "MOBILITY";

  sets: number;

  repsMin?: number;
  repsMax?: number;

  durationSeconds?: number;
  distanceMeters?: number;

  restSeconds: number;

  targetRpe?: number;

  notes?: string;
}

export interface FoundationWorkoutTemplate {
  code: "A" | "B" | "C";

  name: string;

  description: string;

  estimatedDurationMinutes: number;

  exercises: FoundationExercisePrescription[];
}

export const foundationWorkouts: FoundationWorkoutTemplate[] =
  [
    {
      code: "A",

      name: "Força superior + Core",

      description:
        "Puxadas, empurradas e estabilidade de tronco com foco em transferência para o grappling.",

      estimatedDurationMinutes: 60,

      exercises: [
        {
          slug: "lat-pulldown",
          block: "MAIN",
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 120,
          targetRpe: 7,
        },

        {
          slug: "machine-chest-press",
          block: "MAIN",
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 120,
          targetRpe: 7,
        },

        {
          slug: "seated-cable-row",
          block: "ACCESSORY",
          sets: 3,
          repsMin: 10,
          repsMax: 12,
          restSeconds: 90,
          targetRpe: 7,
        },

        {
          slug: "face-pull",
          block: "ACCESSORY",
          sets: 2,
          repsMin: 12,
          repsMax: 15,
          restSeconds: 60,
          targetRpe: 6,
        },

        {
          slug: "pallof-press",
          block: "CORE",
          sets: 3,
          repsMin: 10,
          repsMax: 12,
          restSeconds: 60,
          targetRpe: 6,
          notes:
            "Executar as repetições para cada lado.",
        },
      ],
    },

    {
      code: "B",

      name: "Pernas + Quadril",

      description:
        "Força dos membros inferiores, cadeia posterior, estabilidade unilateral e quadril.",

      estimatedDurationMinutes: 60,

      exercises: [
        {
          slug: "leg-press-45",
          block: "MAIN",
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 150,
          targetRpe: 7,
        },

        {
          slug: "dumbbell-romanian-deadlift",
          block: "MAIN",
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 120,
          targetRpe: 7,
        },

        {
          slug: "bulgarian-split-squat",
          block: "ACCESSORY",
          sets: 2,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 90,
          targetRpe: 6,
          notes:
            "Executar em cada perna. Priorizar estabilidade antes de aumentar carga.",
        },

        {
          slug: "hip-thrust-machine",
          block: "ACCESSORY",
          sets: 3,
          repsMin: 10,
          repsMax: 12,
          restSeconds: 90,
          targetRpe: 7,
        },

        {
          slug: "pallof-press",
          block: "CORE",
          sets: 2,
          repsMin: 10,
          repsMax: 12,
          restSeconds: 60,
          targetRpe: 6,
          notes:
            "Executar para ambos os lados.",
        },
      ],
    },

    {
      code: "C",

      name: "Força geral + Pegada",

      description:
        "Sessão de corpo inteiro com estímulo complementar de força e pegada controlada.",

      estimatedDurationMinutes: 60,

      exercises: [
        {
          slug: "goblet-squat",
          block: "MAIN",
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 120,
          targetRpe: 7,
        },

        {
          slug: "seated-cable-row",
          block: "MAIN",
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          restSeconds: 120,
          targetRpe: 7,
        },

        {
          slug: "machine-chest-press",
          block: "ACCESSORY",
          sets: 2,
          repsMin: 10,
          repsMax: 12,
          restSeconds: 90,
          targetRpe: 6,
        },

        {
          slug: "farmers-walk",
          block: "GRIP",
          sets: 3,
          distanceMeters: 30,
          restSeconds: 90,
          targetRpe: 7,
          notes:
            "Finalizar cada série antes de perder postura ou qualidade da pegada.",
        },

        {
          slug: "dead-hang",
          block: "GRIP",
          sets: 2,
          durationSeconds: 20,
          restSeconds: 90,
          targetRpe: 7,
          notes:
            "Não executar até falha absoluta.",
        },
      ],
    },
  ];