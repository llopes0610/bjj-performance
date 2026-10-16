import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Informe a senha atual."),

    newPassword: z
      .string()
      .min(8, "A nova senha precisa ter pelo menos 8 caracteres.")
      .max(128, "Use no máximo 128 caracteres."),
  })
  .refine(
    (data) =>
      data.currentPassword !==
      data.newPassword,
    {
      message:
        "A nova senha precisa ser diferente da atual.",
    }
  );

export async function POST(
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
    changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]
            ?.message ??
          "Dados inválidos.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const user =
      await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },

        select: {
          id: true,
          password: true,
        },
      });

    if (!user?.password) {
      return NextResponse.json(
        {
          error:
            "Usuário não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const currentMatches =
      await bcrypt.compare(
        parsed.data.currentPassword,
        user.password
      );

    if (!currentMatches) {
      return NextResponse.json(
        {
          error:
            "A senha atual está incorreta.",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        parsed.data.newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "CHANGE_PASSWORD_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível alterar a senha.",
      },
      {
        status: 500,
      }
    );
  }
}
