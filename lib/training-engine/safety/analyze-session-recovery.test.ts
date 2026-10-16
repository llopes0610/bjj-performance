import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  analyzeSessionRecovery,
  type SessionRecoveryInput,
} from "./analyze-session-recovery";

const base: SessionRecoveryInput = {
  sessionRpe: 7,
  postWorkoutFeeling: "NORMAL",
  hasPain: false,
  painRegion: null,
  painIntensity: null,
};

describe("analyzeSessionRecovery", () => {
  it("libera a progressão com recuperação adequada", () => {
    const result = analyzeSessionRecovery(base);

    assert.equal(result.status, "READY");
    assert.equal(result.progressionPermission, "ALLOW");
    assert.equal(result.shouldBlockProgression, false);
    assert.equal(result.shouldReduceVolume, false);
  });

  it("dor alta (>= 7) regride, reduz volume e sugere substituição", () => {
    const result = analyzeSessionRecovery({
      ...base,
      hasPain: true,
      painRegion: "ombro",
      painIntensity: 7,
    });

    assert.equal(result.status, "PAIN_ALERT");
    assert.equal(result.progressionPermission, "REGRESS");
    assert.equal(result.shouldReduceVolume, true);
    assert.equal(result.shouldBlockProgression, true);
    assert.equal(result.shouldConsiderExerciseSubstitution, true);
    assert.ok(result.reasons.some((reason) => reason.includes("ombro")));
  });

  it("dor moderada (4 a 6) segura a progressão", () => {
    const result = analyzeSessionRecovery({
      ...base,
      hasPain: true,
      painRegion: "lombar",
      painIntensity: 4,
    });

    assert.equal(result.status, "PAIN_ALERT");
    assert.equal(result.progressionPermission, "HOLD");
    assert.equal(result.shouldBlockProgression, true);
    assert.equal(result.shouldReduceVolume, false);
  });

  it("desconforto leve (1 a 3) também segura a progressão", () => {
    const result = analyzeSessionRecovery({
      ...base,
      hasPain: true,
      painIntensity: 2,
    });

    assert.equal(result.status, "CAUTION");
    assert.equal(result.progressionPermission, "HOLD");
    assert.equal(result.shouldBlockProgression, true);
  });

  it("dor tem prioridade mesmo com ótima sensação pós-treino", () => {
    const result = analyzeSessionRecovery({
      sessionRpe: 5,
      postWorkoutFeeling: "VERY_GOOD",
      hasPain: true,
      painIntensity: 8,
    });

    assert.equal(result.progressionPermission, "REGRESS");
  });

  it("fadiga alta (RPE 10 + muito cansado) regride e reduz volume", () => {
    const result = analyzeSessionRecovery({
      ...base,
      sessionRpe: 10,
      postWorkoutFeeling: "VERY_TIRED",
    });

    assert.equal(result.status, "FATIGUED");
    assert.equal(result.progressionPermission, "REGRESS");
    assert.equal(result.shouldReduceVolume, true);
    assert.equal(result.shouldBlockProgression, true);
  });

  it("recuperação incompleta (RPE 9 + cansado) segura a progressão", () => {
    const result = analyzeSessionRecovery({
      ...base,
      sessionRpe: 9,
      postWorkoutFeeling: "TIRED",
    });

    assert.equal(result.status, "CAUTION");
    assert.equal(result.progressionPermission, "HOLD");
  });

  it("mantém o score de fadiga entre 0 e 10", () => {
    const low = analyzeSessionRecovery({
      ...base,
      sessionRpe: 1,
      postWorkoutFeeling: "VERY_GOOD",
    });

    assert.equal(low.fatigueScore, 0);

    const high = analyzeSessionRecovery({
      ...base,
      sessionRpe: 10,
      postWorkoutFeeling: "VERY_TIRED",
    });

    assert.ok(high.fatigueScore <= 10);
  });
});
