/*
 * Catálogo de conquistas.
 *
 * Filosofia:
 * recompensar consistência, não excesso.
 *
 * Todas as regras usam fatos de treino
 * prescrito: treinos únicos por semana do
 * programa, streak semanal e programas
 * concluídos. Sessões extras repetidas na
 * mesma semana não contam.
 */
export type AchievementRule =
  | {
      type: "COMPLETED_WORKOUTS";
      threshold: number;
    }
  | {
      type: "WEEKLY_STREAK";
      threshold: number;
    }
  | {
      type: "PROGRAM_COMPLETED";
    };

export const achievementCatalog = [
  {
    code: "FIRST_WORKOUT",
    name: "Primeiro treino",
    description:
      "Concluiu o primeiro treino da sua preparação física.",
    category: "TRAINING",
    xpReward: 100,
    rule: {
      type: "COMPLETED_WORKOUTS",
      threshold: 1,
    },
  },
  {
    code: "WORKOUTS_10",
    name: "10 treinos",
    description:
      "Concluiu 10 treinos prescritos.",
    category: "MILESTONE",
    xpReward: 100,
    rule: {
      type: "COMPLETED_WORKOUTS",
      threshold: 10,
    },
  },
  {
    code: "WORKOUTS_25",
    name: "25 treinos",
    description:
      "Concluiu 25 treinos prescritos.",
    category: "MILESTONE",
    xpReward: 200,
    rule: {
      type: "COMPLETED_WORKOUTS",
      threshold: 25,
    },
  },
  {
    code: "WORKOUTS_50",
    name: "50 treinos",
    description:
      "Concluiu 50 treinos prescritos.",
    category: "MILESTONE",
    xpReward: 300,
    rule: {
      type: "COMPLETED_WORKOUTS",
      threshold: 50,
    },
  },
  {
    code: "WORKOUTS_100",
    name: "100 treinos",
    description:
      "Concluiu 100 treinos prescritos.",
    category: "MILESTONE",
    xpReward: 500,
    rule: {
      type: "COMPLETED_WORKOUTS",
      threshold: 100,
    },
  },
  {
    code: "STREAK_4_WEEKS",
    name: "4 semanas de consistência",
    description:
      "Concluiu todos os treinos prescritos por 4 semanas seguidas.",
    category: "CONSISTENCY",
    xpReward: 300,
    rule: {
      type: "WEEKLY_STREAK",
      threshold: 4,
    },
  },
  {
    code: "STREAK_8_WEEKS",
    name: "8 semanas de consistência",
    description:
      "Concluiu todos os treinos prescritos por 8 semanas seguidas.",
    category: "CONSISTENCY",
    xpReward: 500,
    rule: {
      type: "WEEKLY_STREAK",
      threshold: 8,
    },
  },
  {
    code: "FIRST_PROGRAM",
    name: "Primeiro programa",
    description:
      "Concluiu todas as semanas de um programa de treinamento.",
    category: "PROGRAM",
    xpReward: 300,
    rule: {
      type: "PROGRAM_COMPLETED",
    },
  },
] as const satisfies readonly {
  code: string;
  name: string;
  description: string;
  category:
    | "TRAINING"
    | "CONSISTENCY"
    | "MILESTONE"
    | "PROGRAM";
  xpReward: number;
  rule: AchievementRule;
}[];

export type AchievementCode =
  (typeof achievementCatalog)[number]["code"];
