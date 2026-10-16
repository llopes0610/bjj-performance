import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeProgression } from "./analyze-progression";

const repsPrescription = {
  executionType: "REPS" as const,
  prescribedRepsMin: 8,
  prescribedRepsMax: 10,
  prescribedDurationSeconds: null,
  prescribedDistanceMeters: null,
  targetRpe: 7,
};

function repsSet(
  reps: number,
  rpe: number,
  weightKg: number | null = 40
) {
  return { weightKg, reps, rpe };
}

describe("analyzeProgression (REPS)", () => {
  it("progride quando todas as séries chegam ao topo com RPE controlado", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [repsSet(10, 7), repsSet(10, 7), repsSet(10, 6)],
    });

    assert.equal(result.decision, "PROGRESS");
    assert.equal(result.suggestedWeightKg, 41);
  });

  it("mantém quando fica dentro da faixa sem chegar ao topo", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [repsSet(10, 7), repsSet(9, 7), repsSet(8, 7)],
    });

    assert.equal(result.decision, "MAINTAIN");
    assert.equal(result.suggestedWeightKg, 40);
  });

  it("não progride quando o RPE passa do alvo, mesmo no topo da faixa", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [repsSet(10, 8), repsSet(10, 8)],
    });

    assert.equal(result.decision, "MAINTAIN");
  });

  it("regride quando o RPE fica mais de 1 ponto acima do alvo", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [repsSet(10, 9), repsSet(10, 9)],
    });

    assert.equal(result.decision, "REGRESS");
    assert.equal(result.suggestedWeightKg, 38);
  });

  it("regride quando a média fica abaixo do mínimo de repetições", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [repsSet(6, 7), repsSet(7, 7)],
    });

    assert.equal(result.decision, "REGRESS");
  });

  it("sem carga registrada, decide sem sugerir peso", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [repsSet(10, 6, null), repsSet(10, 6, null)],
    });

    assert.equal(result.decision, "PROGRESS");
    assert.equal(result.suggestedWeightKg, null);
  });

  it("retorna NO_DATA sem séries concluídas", () => {
    const result = analyzeProgression({
      ...repsPrescription,
      sets: [{ weightKg: 40, reps: 10, rpe: null }],
    });

    assert.equal(result.decision, "NO_DATA");
  });
});

describe("analyzeProgression (TIME)", () => {
  const timePrescription = {
    executionType: "TIME" as const,
    prescribedRepsMin: null,
    prescribedRepsMax: null,
    prescribedDurationSeconds: 30,
    prescribedDistanceMeters: null,
    targetRpe: 7,
  };

  function timeSet(durationSeconds: number, rpe: number) {
    return { weightKg: null, reps: null, rpe, durationSeconds };
  }

  it("progride 5 segundos quando todas as séries cumprem o tempo", () => {
    const result = analyzeProgression({
      ...timePrescription,
      sets: [timeSet(30, 7), timeSet(32, 6)],
    });

    assert.equal(result.decision, "PROGRESS");
    assert.equal(result.suggestedDurationSeconds, 35);
  });

  it("mantém quando uma série fica um pouco abaixo do tempo", () => {
    const result = analyzeProgression({
      ...timePrescription,
      sets: [timeSet(30, 7), timeSet(28, 7)],
    });

    assert.equal(result.decision, "MAINTAIN");
    assert.equal(result.suggestedDurationSeconds, 30);
  });

  it("regride quando a média fica abaixo de 90% do tempo", () => {
    const result = analyzeProgression({
      ...timePrescription,
      sets: [timeSet(20, 7), timeSet(22, 7)],
    });

    assert.equal(result.decision, "REGRESS");
    assert.equal(result.suggestedDurationSeconds, 27);
  });
});

describe("analyzeProgression (DISTANCE)", () => {
  const distancePrescription = {
    executionType: "DISTANCE" as const,
    prescribedRepsMin: null,
    prescribedRepsMax: null,
    prescribedDurationSeconds: null,
    prescribedDistanceMeters: 30,
    targetRpe: 7,
  };

  function distanceSet(distanceMeters: number, rpe: number) {
    return { weightKg: 20, reps: null, rpe, distanceMeters };
  }

  it("progride a carga e mantém a distância", () => {
    const result = analyzeProgression({
      ...distancePrescription,
      sets: [distanceSet(30, 7), distanceSet(30, 7)],
    });

    assert.equal(result.decision, "PROGRESS");
    assert.equal(result.suggestedWeightKg, 20.5);
    assert.equal(result.suggestedDistanceMeters, 30);
  });

  it("regride quando o RPE fica muito acima do alvo", () => {
    const result = analyzeProgression({
      ...distancePrescription,
      sets: [distanceSet(30, 9), distanceSet(30, 9)],
    });

    assert.equal(result.decision, "REGRESS");
  });
});
