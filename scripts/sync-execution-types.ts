import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function getExecutionType({
  repsMin,
  repsMax,
  durationSeconds,
  distanceMeters,
}: {
  repsMin: number | null;
  repsMax: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
}) {
  if (distanceMeters !== null) {
    return "DISTANCE" as const;
  }

  if (durationSeconds !== null) {
    return "TIME" as const;
  }

  if (
    repsMin !== null &&
    repsMax !== null
  ) {
    return "REPS" as const;
  }

  return "REPS" as const;
}

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não está definida."
  );
}

const adapter =
  new PrismaPg({
    connectionString,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

async function main() {
  const exercises =
    await prisma.workoutExercise.findMany({
      include: {
        weeklyPrescriptions: true,
      },
    });

  let workoutExercisesUpdated = 0;
  let prescriptionsUpdated = 0;

  for (const exercise of exercises) {
    const executionType =
      getExecutionType({
        repsMin:
          exercise.repsMin,

        repsMax:
          exercise.repsMax,

        durationSeconds:
          exercise.durationSeconds,

        distanceMeters:
          exercise.distanceMeters,
      });

    if (
      exercise.executionType !==
      executionType
    ) {
      await prisma.workoutExercise.update({
        where: {
          id: exercise.id,
        },

        data: {
          executionType,
        },
      });

      workoutExercisesUpdated++;
    }

    for (
      const prescription
      of exercise.weeklyPrescriptions
    ) {
      const prescriptionExecutionType =
        getExecutionType({
          repsMin:
            prescription.repsMin,

          repsMax:
            prescription.repsMax,

          durationSeconds:
            prescription.durationSeconds,

          distanceMeters:
            prescription.distanceMeters,
        });

      if (
        prescription.executionType !==
        prescriptionExecutionType
      ) {
        await prisma.workoutExercisePrescription.update({
          where: {
            id:
              prescription.id,
          },

          data: {
            executionType:
              prescriptionExecutionType,
          },
        });

        prescriptionsUpdated++;
      }
    }
  }

  console.log(
    "Sincronização concluída."
  );

  console.log(
    `WorkoutExercise atualizados: ${workoutExercisesUpdated}`
  );

  console.log(
    `Prescrições atualizadas: ${prescriptionsUpdated}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });