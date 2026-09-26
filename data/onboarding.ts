import {
  TrainingGoal,
  WeekDay,
} from "@/types/onboarding";

export const WEEK_DAYS: {
  value: WeekDay;
  shortLabel: string;
  label: string;
}[] = [
  {
    value: "MONDAY",
    shortLabel: "SEG",
    label: "Segunda",
  },
  {
    value: "TUESDAY",
    shortLabel: "TER",
    label: "Terça",
  },
  {
    value: "WEDNESDAY",
    shortLabel: "QUA",
    label: "Quarta",
  },
  {
    value: "THURSDAY",
    shortLabel: "QUI",
    label: "Quinta",
  },
  {
    value: "FRIDAY",
    shortLabel: "SEX",
    label: "Sexta",
  },
  {
    value: "SATURDAY",
    shortLabel: "SÁB",
    label: "Sábado",
  },
  {
    value: "SUNDAY",
    shortLabel: "DOM",
    label: "Domingo",
  },
];

export const TRAINING_GOALS: {
  value: TrainingGoal;
  label: string;
  description: string;
}[] = [
  {
    value: "STRENGTH",
    label: "Força",
    description:
      "Produzir mais força contra resistência.",
  },
  {
    value: "GRIP",
    label: "Pegada",
    description:
      "Grips, dedos e antebraços mais resistentes.",
  },
  {
    value: "POWER",
    label: "Explosão",
    description:
      "Aplicar força rapidamente.",
  },
  {
    value: "CONDITIONING",
    label: "Condicionamento",
    description:
      "Melhorar recuperação e desempenho nos rounds.",
  },
  {
    value: "MOBILITY",
    label: "Mobilidade",
    description:
      "Melhorar amplitude e controle das articulações.",
  },
  {
    value: "HYPERTROPHY",
    label: "Massa muscular",
    description:
      "Construir musculatura sem perder performance.",
  },
  {
    value: "ENDURANCE",
    label: "Resistência",
    description:
      "Sustentar produção de força por mais tempo.",
  },
  {
    value: "INJURY_PREVENTION",
    label: "Prevenção",
    description:
      "Aumentar robustez e estabilidade.",
  },
];