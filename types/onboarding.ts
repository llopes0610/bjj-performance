export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type Belt =
  | "WHITE"
  | "BLUE"
  | "PURPLE"
  | "BROWN"
  | "BLACK";

export type TrainingExperience =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED";

export type TrainingGoal =
  | "STRENGTH"
  | "GRIP"
  | "POWER"
  | "CONDITIONING"
  | "MOBILITY"
  | "HYPERTROPHY"
  | "ENDURANCE"
  | "INJURY_PREVENTION";

export type TrainingPreference =
  | "AVOID_BARBELL"
  | "AVOID_HIGH_IMPACT"
  | "PREFER_MACHINES"
  | "PREFER_DUMBBELLS"
  | "PREFER_CABLES"
  | "PREFER_BODYWEIGHT";

export interface GoalPriority {
  goal: TrainingGoal;
  priority: number;
}

export interface AthleteRestrictionInput {
  bodyArea: string;
  description: string;

  recovered: boolean;
  medicallyCleared: boolean;
  currentlyPainful: boolean;
}

export interface OnboardingData {
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;

  belt: Belt;
  beltDegree: number;

  experience: TrainingExperience;

  giTraining: boolean;
  noGiTraining: boolean;

  bjjTrainingDays: WeekDay[];
  strengthTrainingDays: WeekDay[];

  sessionDurationMinutes: number;

  goals: TrainingGoal[];
  goalPriorities: GoalPriority[];

  restrictions: AthleteRestrictionInput[];

  trainingPreferences: TrainingPreference[];
}