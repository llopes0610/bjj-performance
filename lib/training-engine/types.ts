export type TrainingPhase =
  | "FOUNDATION"
  | "STRENGTH"
  | "STRENGTH_ENDURANCE"
  | "POWER"
  | "BJJ_PERFORMANCE";

export type TrainingVolume =
  | "LOW"
  | "MODERATE"
  | "HIGH";

export interface AthleteTrainingContext {
  age: number;

  weightKg: number;
  heightCm: number;

  bjjDaysPerWeek: number;
  strengthDaysPerWeek: number;

  giTraining: boolean;
  noGiTraining: boolean;

  sessionDurationMinutes: number;

  goals: string[];

  trainingPreferences: string[];

  hasActiveRestriction: boolean;
  hasCurrentPain: boolean;
}

export interface TrainingRecommendation {
  phase: TrainingPhase;

  recommendedStrengthDays: 2 | 3;

  baseRpeMin: number;
  baseRpeMax: number;

  useBarbell: boolean;

  gripVolume: TrainingVolume;

  conditioningVolume: TrainingVolume;

  requiresConservativeProgression: boolean;

  reasons: string[];
}