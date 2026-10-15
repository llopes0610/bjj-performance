import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateAchievements } from "./evaluate-achievements";

describe("evaluateAchievements", () => {
  it("não desbloqueia nada sem treinos", () => {
    assert.deepEqual(
      evaluateAchievements({
        completedWorkouts: 0,
        currentStreak: 0,
        hasCompletedProgram: false,
      }),
      []
    );
  });

  it("desbloqueia o primeiro treino", () => {
    assert.deepEqual(
      evaluateAchievements({
        completedWorkouts: 1,
        currentStreak: 0,
        hasCompletedProgram: false,
      }),
      ["FIRST_WORKOUT"]
    );
  });

  it("desbloqueia marcos de treinos por limiar", () => {
    const codes = evaluateAchievements({
      completedWorkouts: 25,
      currentStreak: 0,
      hasCompletedProgram: false,
    });

    assert.ok(codes.includes("WORKOUTS_10"));
    assert.ok(codes.includes("WORKOUTS_25"));
    assert.ok(!codes.includes("WORKOUTS_50"));
  });

  it("desbloqueia consistência pelo streak semanal", () => {
    const four = evaluateAchievements({
      completedWorkouts: 12,
      currentStreak: 4,
      hasCompletedProgram: false,
    });

    assert.ok(four.includes("STREAK_4_WEEKS"));
    assert.ok(!four.includes("STREAK_8_WEEKS"));

    const eight = evaluateAchievements({
      completedWorkouts: 24,
      currentStreak: 8,
      hasCompletedProgram: false,
    });

    assert.ok(eight.includes("STREAK_8_WEEKS"));
  });

  it("desbloqueia o primeiro programa", () => {
    const codes = evaluateAchievements({
      completedWorkouts: 18,
      currentStreak: 6,
      hasCompletedProgram: true,
    });

    assert.ok(codes.includes("FIRST_PROGRAM"));
  });
});
