import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getNextWorkout } from "./get-next-workout";

type Status = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

function workout(id: string, order: number, statuses: Status[] = []) {
  return {
    id,
    order,
    sessions: statuses.map((status) => ({ status })),
  };
}

describe("getNextWorkout", () => {
  it("retorna null sem treinos", () => {
    assert.equal(getNextWorkout([]), null);
  });

  it("segue a ordem do programa, não a ordem do array", () => {
    const result = getNextWorkout([
      workout("C", 3),
      workout("A", 1),
      workout("B", 2),
    ]);

    assert.equal(result?.id, "A");
  });

  it("pula os treinos concluídos", () => {
    const result = getNextWorkout([
      workout("A", 1, ["COMPLETED"]),
      workout("B", 2),
      workout("C", 3),
    ]);

    assert.equal(result?.id, "B");
  });

  it("prioriza o treino em andamento", () => {
    const result = getNextWorkout([
      workout("A", 1),
      workout("B", 2, ["IN_PROGRESS"]),
    ]);

    assert.equal(result?.id, "B");
  });

  it("sessão cancelada não conta como concluída", () => {
    const result = getNextWorkout([
      workout("A", 1, ["CANCELLED"]),
      workout("B", 2),
    ]);

    assert.equal(result?.id, "A");
  });

  it("funciona com quantidade variável de treinos (2 por semana)", () => {
    assert.equal(
      getNextWorkout([
        workout("A", 1, ["COMPLETED"]),
        workout("B", 2, ["COMPLETED"]),
      ]),
      null
    );
  });
});
