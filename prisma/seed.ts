import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

import { exerciseCatalog } from "../data/exercises/catalog";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não foi definida no arquivo .env."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    "Iniciando seed de exercícios..."
  );

  for (const exercise of exerciseCatalog) {
    await prisma.exercise.upsert({
      where: {
        slug: exercise.slug,
      },

      update: {
        name: exercise.name,
        description:
          exercise.description,

        category:
          exercise.category,

        movement:
          exercise.movement,

        difficulty:
          exercise.difficulty,

        primaryRegion:
          exercise.primaryRegion,

        secondaryRegions: [
          ...exercise.secondaryRegions,
        ],

        equipment: [
          ...exercise.equipment,
        ],

        instructions: [
          ...exercise.instructions,
        ],

        commonErrors: [
          ...exercise.commonErrors,
        ],

        bjjTransfer:
          exercise.bjjTransfer,

        avoidForPainRegions: [
          ...exercise.avoidForPainRegions,
        ],

        isActive: true,
      },

      create: {
        slug: exercise.slug,

        name: exercise.name,

        description:
          exercise.description,

        category:
          exercise.category,

        movement:
          exercise.movement,

        difficulty:
          exercise.difficulty,

        primaryRegion:
          exercise.primaryRegion,

        secondaryRegions: [
          ...exercise.secondaryRegions,
        ],

        equipment: [
          ...exercise.equipment,
        ],

        instructions: [
          ...exercise.instructions,
        ],

        commonErrors: [
          ...exercise.commonErrors,
        ],

        bjjTransfer:
          exercise.bjjTransfer,

        avoidForPainRegions: [
          ...exercise.avoidForPainRegions,
        ],

        isActive: true,
      },
    });
  }

  console.log(
    `${exerciseCatalog.length} exercícios processados.`
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