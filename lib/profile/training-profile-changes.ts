/*
 * Compara os dados do atleta antes e depois de uma edição
 * do perfil e diz se algo que afeta o programa de treino
 * mudou.
 *
 * Idade, peso, altura e faixa não disparam o aviso de novo
 * programa: são ajustes frequentes e o programa atual
 * continua adequado.
 */

export interface TrainingProfileSnapshot {
  experience: string;

  giTraining: boolean;
  noGiTraining: boolean;

  bjjTrainingDays: readonly string[];
  strengthTrainingDays: readonly string[];

  sessionDurationMinutes: number;

  goals: readonly string[];
  goalPriorities: readonly {
    goal: string;
    priority: number;
  }[];

  trainingPreferences: readonly string[];

  restrictions: readonly {
    bodyArea: string;
    description: string;
    recovered: boolean;
    medicallyCleared: boolean;
    currentlyPainful: boolean;
  }[];
}

export type TrainingProfileField =
  | "experience"
  | "modalities"
  | "schedule"
  | "sessionDuration"
  | "goals"
  | "preferences"
  | "restrictions";

export interface TrainingProfileChanges {
  changed: boolean;
  restrictionsChanged: boolean;
  fields: TrainingProfileField[];
}

function sameSet(
  a: readonly string[],
  b: readonly string[]
) {
  const left = new Set(a);
  const right = new Set(b);

  return (
    left.size === right.size &&
    [...left].every((item) =>
      right.has(item)
    )
  );
}

function goalPriorityKeys(
  items: TrainingProfileSnapshot["goalPriorities"]
) {
  return items.map(
    (item) =>
      `${item.goal}:${item.priority}`
  );
}

function restrictionKeys(
  items: TrainingProfileSnapshot["restrictions"]
) {
  return items.map((item) =>
    JSON.stringify([
      item.bodyArea.trim().toLowerCase(),
      item.description.trim().toLowerCase(),
      item.recovered,
      item.medicallyCleared,
      item.currentlyPainful,
    ])
  );
}

export function getTrainingProfileChanges(
  before: TrainingProfileSnapshot,
  after: TrainingProfileSnapshot
): TrainingProfileChanges {
  const fields: TrainingProfileField[] =
    [];

  if (
    before.experience !==
    after.experience
  ) {
    fields.push("experience");
  }

  if (
    before.giTraining !==
      after.giTraining ||
    before.noGiTraining !==
      after.noGiTraining
  ) {
    fields.push("modalities");
  }

  if (
    !sameSet(
      before.bjjTrainingDays,
      after.bjjTrainingDays
    ) ||
    !sameSet(
      before.strengthTrainingDays,
      after.strengthTrainingDays
    )
  ) {
    fields.push("schedule");
  }

  if (
    before.sessionDurationMinutes !==
    after.sessionDurationMinutes
  ) {
    fields.push("sessionDuration");
  }

  if (
    !sameSet(
      before.goals,
      after.goals
    ) ||
    !sameSet(
      goalPriorityKeys(
        before.goalPriorities
      ),
      goalPriorityKeys(
        after.goalPriorities
      )
    )
  ) {
    fields.push("goals");
  }

  if (
    !sameSet(
      before.trainingPreferences,
      after.trainingPreferences
    )
  ) {
    fields.push("preferences");
  }

  const beforeRestrictions =
    restrictionKeys(
      before.restrictions
    );

  const afterRestrictions =
    restrictionKeys(
      after.restrictions
    );

  const restrictionsChanged =
    beforeRestrictions.length !==
      afterRestrictions.length ||
    !sameSet(
      beforeRestrictions,
      afterRestrictions
    );

  if (restrictionsChanged) {
    fields.push("restrictions");
  }

  return {
    changed: fields.length > 0,
    restrictionsChanged,
    fields,
  };
}
