import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateLevel,
  getTotalXpForLevel,
  getXpRequiredForLevel,
} from "./calculate-level";

describe("calculateLevel", () => {
  it("segue a curva definida (cada nível exige +100 XP)", () => {
    const expected = [0, 500, 1100, 1800, 2600, 3500, 4500, 5600, 6800, 8100];

    expected.forEach((totalXp, index) => {
      assert.equal(getTotalXpForLevel(index + 1), totalXp);
    });

    assert.equal(getXpRequiredForLevel(1), 500);
    assert.equal(getXpRequiredForLevel(2), 600);
  });

  it("começa no nível 1 com 0 XP", () => {
    const result = calculateLevel(0);

    assert.equal(result.level, 1);
    assert.equal(result.currentLevelXp, 0);
    assert.equal(result.xpToNextLevel, 500);
    assert.equal(result.progressPercentage, 0);
  });

  it("sobe de nível exatamente no limite", () => {
    assert.equal(calculateLevel(499).level, 1);
    assert.equal(calculateLevel(500).level, 2);
    assert.equal(calculateLevel(1100).level, 3);
  });

  it("calcula o progresso dentro do nível", () => {
    const result = calculateLevel(800);

    assert.equal(result.level, 2);
    assert.equal(result.currentLevelXp, 300);
    assert.equal(result.xpRequiredForLevel, 600);
    assert.equal(result.xpToNextLevel, 300);
    assert.equal(result.progressPercentage, 50);
  });

  it("trata XP negativo ou fracionado sem quebrar", () => {
    assert.equal(calculateLevel(-50).level, 1);
    assert.equal(calculateLevel(-50).totalXp, 0);
    assert.equal(calculateLevel(500.9).totalXp, 500);
  });
});
