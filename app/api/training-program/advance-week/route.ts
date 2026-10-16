import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  paymentRequiredResponseBody,
  userHasAccess,
} from "@/lib/billing/get-access";
import { prisma } from "@/lib/prisma";
import { createWeekPrescriptions } from "@/lib/training-engine/prescription/create-week-prescriptions";

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Não autorizado.",
                },
                {
                    status: 401,
                }
            );
        }

        if (
            !(await userHasAccess(
                session.user.email
            ))
        ) {
            return NextResponse.json(
                paymentRequiredResponseBody(),
                {
                    status: 402,
                }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },

            include: {
                athleteProfile: true,
            },
        });

        if (!user?.athleteProfile) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Perfil do atleta não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const athleteId =
            user.athleteProfile.id;

        const program =
            await prisma.trainingProgram.findFirst({
                where: {
                    athleteId,
                    status: "ACTIVE",
                },

                orderBy: {
                    createdAt: "desc",
                },

                include: {
                    workouts: {
                        orderBy: {
                            order: "asc",
                        },

                        include: {
                            sessions: {
                                where: {
                                    athleteId,
                                },

                                orderBy: {
                                    startedAt: "desc",
                                },
                            },
                        },
                    },
                },
            });

        if (!program) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Programa ativo não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const currentWeek =
            program.currentWeek;

        /*
         * Para cada treino do programa verificamos
         * se existe uma sessão COMPLETED referente
         * especificamente à semana atual.
         */
        const allWorkoutsCompleted =
            program.workouts.every((workout) =>
                workout.sessions.some(
                    (workoutSession) =>
                        workoutSession.status ===
                        "COMPLETED" &&
                        workoutSession.programWeek ===
                        currentWeek
                )
            );

        if (!allWorkoutsCompleted) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Todos os treinos da semana precisam estar concluídos.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Se currentWeek já for igual à duração,
         * não existe uma próxima semana.
         */
        if (
            currentWeek >=
            program.durationWeeks
        ) {
            return NextResponse.json(
                {
                    success: false,
                    programCompleted: true,
                    error:
                        "Todas as semanas do programa foram concluídas.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Atualização condicional.
         *
         * O currentWeek também entra no WHERE.
         * Isso reduz o risco de dois cliques/requisições
         * avançarem duas semanas.
         */
        const result =
            await prisma.trainingProgram.updateMany({
                where: {
                    id: program.id,
                    status: "ACTIVE",
                    currentWeek,
                },

                data: {
                    currentWeek: {
                        increment: 1,
                    },
                },
            });

        if (result.count !== 1) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "O programa já foi atualizado. Recarregue a página.",
                },
                {
                    status: 409,
                }
            );
        }

        const nextWeek =
            currentWeek + 1;

        try {
            await createWeekPrescriptions({
                programId: program.id,
                programWeek: nextWeek,
            });
        } catch (error) {
            /*
             * Sem prescrições, a semana não pode
             * começar: desfaz o avanço (só se ninguém
             * mexeu no programa nesse meio tempo) para
             * o atleta tentar de novo.
             */
            await prisma.trainingProgram.updateMany({
                where: {
                    id: program.id,
                    status: "ACTIVE",
                    currentWeek: nextWeek,
                },

                data: {
                    currentWeek,
                },
            });

            throw error;
        }

        return NextResponse.json({
            success: true,
            previousWeek: currentWeek,
            currentWeek: nextWeek,
        });
    } catch (error) {
        console.error(
            "ADVANCE_PROGRAM_WEEK_ERROR",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Não foi possível avançar para a próxima semana.",
            },
            {
                status: 500,
            }
        );
    }
}