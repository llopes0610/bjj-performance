import {
  AthleteTrainingContext,
  TrainingRecommendation,
} from "./types";

export function analyzeAthlete(
  athlete: AthleteTrainingContext
): TrainingRecommendation {
  const reasons: string[] = [];

  let recommendedStrengthDays: 2 | 3 = 3;

  let baseRpeMin = 6;
  let baseRpeMax = 7;

  let gripVolume: "LOW" | "MODERATE" | "HIGH" =
    "MODERATE";

  let conditioningVolume: "LOW" | "MODERATE" | "HIGH" =
    "MODERATE";

  let requiresConservativeProgression = false;

  /*
   * Preferências de equipamento
   */
  const useBarbell =
    !athlete.trainingPreferences.includes(
      "AVOID_BARBELL"
    );

  if (!useBarbell) {
    reasons.push(
      "Barra livre removida conforme preferência do atleta."
    );
  }

  /*
   * Recuperação
   */
  if (athlete.age >= 30) {
    reasons.push(
      "Recuperação entre estímulos considerada devido à faixa etária do atleta."
    );
  }

  /*
   * Frequência de musculação
   */
  if (athlete.bjjDaysPerWeek >= 4) {
    recommendedStrengthDays = 2;

    reasons.push(
      "Frequência elevada de Jiu-Jitsu: musculação limitada a duas sessões para controlar fadiga."
    );
  }

  if (
    athlete.bjjDaysPerWeek === 3 &&
    athlete.strengthDaysPerWeek >= 3
  ) {
    recommendedStrengthDays = 3;

    reasons.push(
      "Três sessões de força são compatíveis com a frequência atual de Jiu-Jitsu."
    );
  }

  /*
   * Dor ou restrição atual
   */
  if (
    athlete.hasActiveRestriction ||
    athlete.hasCurrentPain
  ) {
    baseRpeMax = 6;

    requiresConservativeProgression = true;

    reasons.push(
      "Existe restrição ou dor atual; intensidade limitada e progressão conservadora ativada."
    );
  }

  /*
   * Grip
   *
   * Kimono já gera uma carga considerável
   * para dedos e antebraços.
   */
  if (
    athlete.giTraining &&
    athlete.bjjDaysPerWeek >= 3
  ) {
    gripVolume = "LOW";

    reasons.push(
      "Treinos frequentes com kimono já geram alta demanda de pegada; o volume adicional de grip será controlado."
    );
  }

  /*
   * Condicionamento
   */
  if (
    athlete.goals.includes("CONDITIONING") &&
    athlete.bjjDaysPerWeek <= 3
  ) {
    conditioningVolume = "MODERATE";
  }

  if (athlete.bjjDaysPerWeek >= 5) {
    conditioningVolume = "LOW";

    reasons.push(
      "Volume elevado de Jiu-Jitsu: condicionamento adicional reduzido."
    );
  }

  return {
    phase: "FOUNDATION",

    recommendedStrengthDays,

    baseRpeMin,
    baseRpeMax,

    useBarbell,

    gripVolume,

    conditioningVolume,

    requiresConservativeProgression,

    reasons,
  };
}