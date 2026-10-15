import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 letras.")
    .max(60, "Use no máximo 60 caracteres."),
});

export async function PATCH(
  request: Request
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  const body = await request
    .json()
    .catch(() => null);

  const parsed =
    updateNameSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]
            ?.message ??
          "Nome inválido.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    await prisma.user.update({
      where: {
        email: session.user.email,
      },

      data: {
        name: parsed.data.name,
      },
    });

    return NextResponse.json({
      success: true,
      name: parsed.data.name,
    });
  } catch (error) {
    console.error(
      "UPDATE_ACCOUNT_NAME_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível salvar o nome.",
      },
      {
        status: 500,
      }
    );
  }
}
