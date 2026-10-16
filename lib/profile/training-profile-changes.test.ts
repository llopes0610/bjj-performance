import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getTrainingProfileChanges,
  type TrainingProfileSnapshot,
} from "./training-profile-changes";

const base: TrainingProfileSnapshot = {
  experience: "BEGINNER",
  giTraining: true,
  noGiTraining: false,
  bjjTrainingDays: ["MONDAY", "WEDNESDAY"],
  strengthTrainingDays: ["TUESDAY", "THURSDAY"],
  sessionDurationMinutes: 60,
  goals: ["STRENGTH", "GRIP"],
  goalPriorities: [
    { goal: "STRENGTH", priority: 1 },
    { goal: "GRIP", priority: 2 },
  ],
  trainingPreferences: ["PREFER_MACHINES"],
  restrictions: [
    {
      bodyArea: "Joelho",
      description: "Dor ao agachar",
      recovered: false,
      medicallyCleared: false,
      currentlyPainful: true,
    },
  ],
};

describe("getTrainingProfileChanges", () => {
  it("não aponta mudança quando nada mudou, mesmo com ordem diferente", () => {
    const result = getTrainingProfileChanges(base, {
      ...base,
      bjjTrainingDays: ["WEDNESDAY", "MONDAY"],
      goals: ["GRIP", "STRENGTH"],
      goalPriorities: [...base.goalPriorities].reverse(),
      restrictions: [
        { ...base.restrictions[0], bodyArea: " joelho " },
      ],
    });

    assert.equal(result.changed, false);
    assert.equal(result.restrictionsChanged, false);
    assert.deepEqual(result.fields, []);
  });

  it("detecta mudança de agenda, objetivos e preferências", () => {
    const result = getTrainingProfileChanges(base, {
      ...base,
      strengthTrainingDays: ["TUESDAY", "FRIDAY"],
      goalPriorities: [
        { goal: "GRIP", priority: 1 },
        { goal: "STRENGTH", priority: 2 },
      ],
      trainingPreferences: [],
    });

    assert.equal(result.changed, true);
    assert.equal(result.restrictionsChanged, false);
    assert.deepEqual(result.fields, ["schedule", "goals", "preferences"]);
  });

  it("detecta restrição nova, removida ou com estado alterado", () => {
    const added = getTrainingProfileChanges(base, {
      ...base,
      restrictions: [
        ...base.restrictions,
        {
          bodyArea: "Ombro",
          description: "Luxação antiga",
          recovered: true,
          medicallyCleared: true,
          currentlyPainful: false,
        },
      ],
    });

    const removed = getTrainingProfileChanges(base, {
      ...base,
      restrictions: [],
    });

    const recovered = getTrainingProfileChanges(base, {
      ...base,
      restrictions: [
        { ...base.restrictions[0], currentlyPainful: false },
      ],
    });

    for (const result of [added, removed, recovered]) {
      assert.equal(result.changed, true);
      assert.equal(result.restrictionsChanged, true);
      assert.deepEqual(result.fields, ["restrictions"]);
    }
  });

  it("detecta experiência, modalidade e duração", () => {
    const result = getTrainingProfileChanges(base, {
      ...base,
      experience: "INTERMEDIATE",
      noGiTraining: true,
      sessionDurationMinutes: 45,
    });

    assert.deepEqual(result.fields, [
      "experience",
      "modalities",
      "sessionDuration",
    ]);
  });
});
