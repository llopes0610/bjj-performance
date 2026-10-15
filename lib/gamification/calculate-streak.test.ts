import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateWeeklyStreak,
  type WeeklyStreakInput,
} from "./calculate-streak";

const base: WeeklyStreakInput = {
  currentStreak: 2,
  longestStreak: 2,
  currentProgramId: "program-1",
  completedWeek: 3,
  lastCompletedProgramId: "program-1",
  lastCompletedWeek: 2,
};

describe("calculateWeeklyStreak", () => {
  it("inicia o streak quando não existe semana anterior", () => {
    const result = calculateWeeklyStreak({
      ...base,
      currentStreak: 0,
      longestStreak: 0,
      completedWeek: 1,
      lastCompletedProgramId: null,
      lastCompletedWeek: null,
    });

    assert.equal(result.action, "STARTED");
    assert.equal(result.currentStreak, 1);
    assert.equal(result.longestStreak, 1);
    assert.equal(result.lastCompletedProgramId, "program-1");
    assert.equal(result.lastCompletedWeek, 1);
    assert.equal(result.changed, true);
  });

  it("incrementa na semana seguinte do mesmo programa", () => {
    const result = calculateWeeklyStreak(base);

    assert.equal(result.action, "INCREMENTED");
    assert.equal(result.currentStreak, 3);
    assert.equal(result.longestStreak, 3);
    assert.equal(result.lastCompletedWeek, 3);
  });

  it("não altera nada quando a mesma semana é reprocessada", () => {
    const result = calculateWeeklyStreak({
      ...base,
      completedWeek: 2,
    });

    assert.equal(result.action, "ALREADY_PROCESSED");
    assert.equal(result.changed, false);
    assert.equal(result.currentStreak, 2);
    assert.equal(result.lastCompletedWeek, 2);
  });

  it("não reduz o streak com retry atrasado de semana antiga", () => {
    const result = calculateWeeklyStreak({
      ...base,
      currentStreak: 3,
      longestStreak: 3,
      lastCompletedWeek: 3,
      completedWeek: 2,
    });

    assert.equal(result.action, "ALREADY_PROCESSED");
    assert.equal(result.changed, false);
    assert.equal(result.currentStreak, 3);
    assert.equal(result.lastCompletedWeek, 3);
  });

  it("reinicia quando uma semana é pulada no mesmo programa", () => {
    const result = calculateWeeklyStreak({
      ...base,
      currentStreak: 5,
      longestStreak: 5,
      completedWeek: 4,
    });

    assert.equal(result.action, "RESET");
    assert.equal(result.currentStreak, 1);
    assert.equal(result.longestStreak, 5);
    assert.equal(result.lastCompletedWeek, 4);
  });

  it("sequência completa: semanas 1 a 3 e retry", () => {
    let state = {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedProgramId: null as string | null,
      lastCompletedWeek: null as number | null,
    };

    for (const week of [1, 2, 2, 3, 3]) {
      const result = calculateWeeklyStreak({
        ...state,
        currentProgramId: "program-1",
        completedWeek: week,
      });

      state = {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        lastCompletedProgramId: result.lastCompletedProgramId,
        lastCompletedWeek: result.lastCompletedWeek,
      };
    }

    assert.equal(state.currentStreak, 3);
    assert.equal(state.longestStreak, 3);
    assert.equal(state.lastCompletedWeek, 3);
  });

  describe("transição entre programas", () => {
    const programChange: WeeklyStreakInput = {
      currentStreak: 6,
      longestStreak: 6,
      currentProgramId: "program-2",
      completedWeek: 1,
      lastCompletedProgramId: "program-1",
      lastCompletedWeek: 6,
    };

    it("continua quando o programa anterior foi concluído", () => {
      const result = calculateWeeklyStreak({
        ...programChange,
        previousProgramCompleted: true,
      });

      assert.equal(result.action, "INCREMENTED");
      assert.equal(result.currentStreak, 7);
      assert.equal(result.longestStreak, 7);
      assert.equal(result.lastCompletedProgramId, "program-2");
      assert.equal(result.lastCompletedWeek, 1);
    });

    it("reinicia quando o programa anterior não foi concluído", () => {
      const result = calculateWeeklyStreak({
        ...programChange,
        lastCompletedWeek: 3,
        previousProgramCompleted: false,
      });

      assert.equal(result.action, "RESET");
      assert.equal(result.currentStreak, 1);
      assert.equal(result.longestStreak, 6);
      assert.equal(result.lastCompletedProgramId, "program-2");
    });

    it("reinicia por padrão quando a camada não informa nada", () => {
      const result = calculateWeeklyStreak(programChange);

      assert.equal(result.action, "RESET");
      assert.equal(result.currentStreak, 1);
    });

    it("reinicia se a semana do novo programa não for a primeira", () => {
      const result = calculateWeeklyStreak({
        ...programChange,
        completedWeek: 2,
        previousProgramCompleted: true,
      });

      assert.equal(result.action, "RESET");
      assert.equal(result.currentStreak, 1);
    });
  });
});
