import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido."),

  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Dados inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const name = parsed.data.name.trim();

    const email = parsed.data.email
      .trim()
      .toLowerCase();

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Já existe uma conta cadastrada com este e-mail.",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        parsed.data.password,
        12
      );

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },

      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      {
        error:
          "Não foi possível criar sua conta.",
      },
      {
        status: 500,
      }
    );
  }
}