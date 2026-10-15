import "dotenv/config";

import assert from "node:assert/strict";

import { achievementCatalog } from "@/data/achievements/catalog";
import { prisma } from "@/lib/prisma";
import { completeWorkoutSession } from "@/lib/workout/complete-workout-session";

/*
 * QA da gamificação contra um banco real.
 *
 * Uso:
 *
 *   npm run qa:gamification
 *     Executa os cenários com um atleta
 *     temporário e remove todos os dados
 *     criados ao final.
 *
 *   npm run qa:gamification -- --audit
 *     Somente leitura. Confere, para todos
 *     os atletas, se o XP total bate com o
 *     ledger e se conquistas e eventos
 *     estão consistentes.
 */

const QA_EMAIL_PREFIX = "qa-gamification-";
const QA_EMAIL_DOMAIN = "@bjj-performance.local";

function ok(message: string) {
  console.log(`  ✓ ${message}`);
}

/*
 * ========================================
 * CENÁRIOS
 * ========================================
 */

async function createProgram(
  athleteId: string,
  codes: string[],
  durationWeeks: number
) {
  return prisma.trainingProgram.create({
    data: {
      athleteId,
      name: "QA",
      phase: "FOUNDATION",
      durationWeeks,
      recommendedStrengthDays:
        codes.length,
      baseRpeMin: 6,
      baseRpeMax: 7,

      workouts: {
        create: codes.map(
          (code, index) => ({
            code,
            name: `Treino ${code}`,
            order: index + 1,
            estimatedDurationMinutes: 45,
          })
        ),
      },
    },

    include: {
      workouts: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });
}

async function startSession(
  athleteId: string,
  workoutId: string,
  programWeek: number
) {
  return prisma.workoutSession.create({
    data: {
      athleteId,
      workoutId,
      programWeek,
    },

    include: {
      workout: {
        select: {
          programId: true,
        },
      },
    },
  });
}

/**
 * Mesmo caminho da rota de finalização.
 */
async function finish(
  session: Awaited<
    ReturnType<typeof startSession>
  >
) {
  return completeWorkoutSession({
    session: {
      id: session.id,
      athleteId: session.athleteId,
      workoutId: session.workoutId,
      programId:
        session.workout.programId,
      programWeek: session.programWeek,
    },

    completedAt: new Date(),

    data: {
      durationMinutes: 45,
      sessionRpe: 7,
      postWorkoutFeeling: "GOOD",
      hasPain: false,
    },
  });
}

async function getProfile(
  athleteId: string
) {
  return prisma.gamificationProfile.findUniqueOrThrow({
    where: {
      athleteId,
    },
  });
}

async function runScenarios() {
  const seededAchievements =
    await prisma.achievement.count({
      where: {
        code: {
          in: achievementCatalog.map(
            (achievement) =>
              achievement.code
          ),
        },
        isActive: true,
      },
    });

  if (
    seededAchievements !==
    achievementCatalog.length
  ) {
    throw new Error(
      "Conquistas ausentes no banco. Rode `npx prisma db seed` antes do QA."
    );
  }

  const user = await prisma.user.create({
    data: {
      email: `${QA_EMAIL_PREFIX}${Date.now()}${QA_EMAIL_DOMAIN}`,
      name: "QA Gamificação",

      athleteProfile: {
        create: {
          age: 30,
          weightKg: 80,
          heightCm: 178,
        },
      },
    },

    include: {
      athleteProfile: true,
    },
  });

  const athleteId =
    user.athleteProfile!.id;

  try {
    const program = await createProgram(
      athleteId,
      ["A", "B"],
      2
    );

    const [workoutA, workoutB] =
      program.workouts;

    console.log(
      "\nSemana 1 (programa com 2 treinos)"
    );

    let result = await finish(
      await startSession(
        athleteId,
        workoutA.id,
        1
      )
    );

    assert.equal(result?.xpAwarded, 200);
    assert.equal(result?.weekCompleted, false);
    assert.deepEqual(
      result?.unlockedAchievements.map(
        (item) => item.code
      ),
      ["FIRST_WORKOUT"]
    );
    ok("primeiro treino: +100 treino +100 conquista, semana ainda aberta");

    const sessionB1 = await startSession(
      athleteId,
      workoutB.id,
      1
    );

    result = await finish(sessionB1);

    assert.equal(result?.xpAwarded, 250);
    assert.equal(result?.weekCompleted, true);
    assert.equal(result?.currentStreak, 1);
    ok("semana completa: +100 treino +150 semana, streak 1");

    console.log("\nDuplicidade");

    assert.equal(
      await finish(sessionB1),
      null
    );
    ok("retry do finish na mesma sessão não processa de novo");

    result = await finish(
      await startSession(
        athleteId,
        workoutA.id,
        1
      )
    );

    assert.equal(result?.xpAwarded, 0);
    assert.equal(
      result?.unlockedAchievements.length,
      0
    );
    ok("sessão extra do mesmo treino na mesma semana: 0 XP");

    const doubleSubmit =
      await startSession(
        athleteId,
        workoutA.id,
        2
      );

    const doubleResults =
      await Promise.all([
        finish(doubleSubmit),
        finish(doubleSubmit),
      ]);

    assert.equal(
      doubleResults.filter(
        (item) => item === null
      ).length,
      1
    );
    ok("duplo clique concorrente: só uma finalização é aceita");

    console.log(
      "\nSemana 2 (última do programa)"
    );

    result = await finish(
      await startSession(
        athleteId,
        workoutB.id,
        2
      )
    );

    assert.equal(result?.weekCompleted, true);
    assert.equal(result?.currentStreak, 2);
    assert.deepEqual(
      result?.unlockedAchievements.map(
        (item) => item.code
      ),
      ["FIRST_PROGRAM"]
    );
    ok("semana final: streak 2 e conquista de programa concluído");

    console.log("\nFinalizações concorrentes");

    const concurrentProgram =
      await createProgram(
        athleteId,
        ["A", "B"],
        4
      );

    const concurrentSessions =
      await Promise.all(
        concurrentProgram.workouts.map(
          (workout) =>
            startSession(
              athleteId,
              workout.id,
              1
            )
        )
      );

    const concurrentResults =
      await Promise.all(
        concurrentSessions.map(
          (session) => finish(session)
        )
      );

    assert.equal(
      concurrentResults.filter(
        (item) => item?.weekCompleted
      ).length,
      1
    );

    let profile =
      await getProfile(athleteId);

    assert.equal(
      profile.currentStreak,
      3
    );
    ok("dois treinos finalizados ao mesmo tempo: a semana conta uma vez");
    ok("programa novo após concluir o anterior: streak continua (3)");

    console.log("\nTroca de programa sem concluir o anterior");

    const resetProgram =
      await createProgram(
        athleteId,
        ["A"],
        4
      );

    result = await finish(
      await startSession(
        athleteId,
        resetProgram.workouts[0].id,
        1
      )
    );

    profile =
      await getProfile(athleteId);

    assert.equal(
      profile.currentStreak,
      1
    );
    assert.equal(
      profile.longestStreak,
      3
    );
    ok("streak volta para 1 e o recorde (3) é mantido");

    console.log("\nConsistência do ledger");

    const ledger =
      await prisma.gamificationEvent.aggregate({
        where: {
          athleteId,
        },

        _sum: {
          xp: true,
        },
      });

    assert.equal(
      ledger._sum.xp ?? 0,
      profile.totalXp
    );
    ok(
      `soma dos eventos = totalXp (${profile.totalXp} XP)`
    );
  } finally {
    /*
     * WorkoutSession -> Workout usa
     * onDelete: Restrict, então as sessões
     * saem antes do usuário.
     */
    await prisma.workoutSession.deleteMany({
      where: {
        athleteId,
      },
    });

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    console.log(
      "\nDados temporários do QA removidos."
    );
  }
}

/*
 * ========================================
 * AUDITORIA (SOMENTE LEITURA)
 * ========================================
 */

async function runAudit() {
  const profiles =
    await prisma.gamificationProfile.findMany({
      select: {
        athleteId: true,
        totalXp: true,
      },
    });

  const ledger =
    await prisma.gamificationEvent.groupBy({
      by: ["athleteId"],

      _sum: {
        xp: true,
      },
    });

  const ledgerByAthlete = new Map(
    ledger.map((item) => [
      item.athleteId,
      item._sum.xp ?? 0,
    ])
  );

  const issues: string[] = [];

  for (const profile of profiles) {
    const ledgerXp =
      ledgerByAthlete.get(
        profile.athleteId
      ) ?? 0;

    if (ledgerXp !== profile.totalXp) {
      issues.push(
        `atleta ${profile.athleteId}: totalXp ${profile.totalXp} ≠ ledger ${ledgerXp}`
      );
    }
  }

  const unlocked =
    await prisma.athleteAchievement.findMany({
      select: {
        athleteId: true,
        achievementId: true,
      },
    });

  const achievementEvents =
    await prisma.gamificationEvent.findMany({
      where: {
        type: "ACHIEVEMENT_UNLOCKED",
      },

      select: {
        athleteId: true,
        sourceId: true,
      },
    });

  const eventKeys = new Set(
    achievementEvents.map(
      (event) =>
        `${event.athleteId}:${event.sourceId}`
    )
  );

  const unlockedKeys = new Set(
    unlocked.map(
      (item) =>
        `${item.athleteId}:${item.achievementId}`
    )
  );

  for (const key of unlockedKeys) {
    if (!eventKeys.has(key)) {
      issues.push(
        `conquista sem evento de XP: ${key}`
      );
    }
  }

  for (const key of eventKeys) {
    if (!unlockedKeys.has(key)) {
      issues.push(
        `evento de conquista sem desbloqueio: ${key}`
      );
    }
  }

  console.log(
    `\n${profiles.length} perfis de gamificação, ${unlocked.length} conquistas desbloqueadas.`
  );

  if (issues.length > 0) {
    console.log(
      `\n${issues.length} inconsistência(s):`
    );

    for (const issue of issues) {
      console.log(`  ✗ ${issue}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    "  ✓ XP total bate com o ledger para todos os atletas"
  );
  console.log(
    "  ✓ conquistas e eventos de conquista consistentes"
  );
}

async function main() {
  if (process.argv.includes("--audit")) {
    await runAudit();
    return;
  }

  await runScenarios();

  console.log(
    "\nQA de gamificação concluído sem falhas."
  );
}

main()
  .catch((error) => {
    console.error(
      "\nQA de gamificação falhou:"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
