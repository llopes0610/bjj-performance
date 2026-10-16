"use client";

import {
  type FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Check,
  KeyRound,
  LoaderCircle,
  UserRound,
} from "lucide-react";

interface AccountSettingsProps {
  name: string;
  email: string;
}

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const inputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition focus:border-primary";

async function readError(
  response: Response,
  fallback: string
) {
  const data = await response
    .json()
    .catch(() => null);

  return data?.error ?? fallback;
}

export function AccountSettings({
  name,
  email,
}: AccountSettingsProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          E-mail
        </p>

        <p className="mt-1 break-all text-sm">
          {email}
        </p>
      </div>

      <NameForm initialName={name} />

      <PasswordForm />
    </div>
  );
}

function NameForm({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();

  const [name, setName] =
    useState(initialName);

  const [loading, setLoading] =
    useState(false);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const unchanged =
    name.trim() ===
    initialName.trim();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || unchanged) {
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(
        "/api/account",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            "Não foi possível salvar o nome."
          )
        );
      }

      setFeedback({
        type: "success",
        message: "Nome atualizado.",
      });

      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o nome.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border p-4"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <UserRound
          size={17}
          className="text-primary"
          aria-hidden="true"
        />
        Nome
      </h3>

      <label className="mt-3 block text-sm text-muted">
        Como você quer ser chamado
        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          autoComplete="name"
          maxLength={60}
          className={inputClass}
        />
      </label>

      <SubmitButton
        loading={loading}
        disabled={unchanged}
        label="Salvar nome"
      />

      <FeedbackMessage
        feedback={feedback}
      />
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({
        type: "error",
        message:
          "A nova senha precisa ter pelo menos 8 caracteres.",
      });

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setFeedback({
        type: "error",
        message:
          "A confirmação não confere com a nova senha.",
      });

      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(
        "/api/account/password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            "Não foi possível alterar a senha."
          )
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setFeedback({
        type: "success",
        message: "Senha alterada.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível alterar a senha.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border p-4"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound
          size={17}
          className="text-primary"
          aria-hidden="true"
        />
        Alterar senha
      </h3>

      <label className="mt-3 block text-sm text-muted">
        Senha atual
        <input
          type="password"
          value={currentPassword}
          onChange={(event) =>
            setCurrentPassword(
              event.target.value
            )
          }
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>

      <label className="mt-3 block text-sm text-muted">
        Nova senha
        <input
          type="password"
          value={newPassword}
          onChange={(event) =>
            setNewPassword(
              event.target.value
            )
          }
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </label>

      <label className="mt-3 block text-sm text-muted">
        Confirmar nova senha
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              event.target.value
            )
          }
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </label>

      <SubmitButton
        loading={loading}
        label="Alterar senha"
      />

      <FeedbackMessage
        feedback={feedback}
      />
    </form>
  );
}

function SubmitButton({
  loading,
  disabled = false,
  label,
}: {
  loading: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {loading && (
        <LoaderCircle
          size={16}
          className="animate-spin"
          aria-hidden="true"
        />
      )}

      {loading
        ? "Salvando..."
        : label}
    </button>
  );
}

function FeedbackMessage({
  feedback,
}: {
  feedback: Feedback;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <p
      role={
        feedback.type === "error"
          ? "alert"
          : "status"
      }
      className={[
        "mt-3 flex items-center gap-1.5 text-sm",
        feedback.type === "error"
          ? "text-red-400"
          : "text-green-400",
      ].join(" ")}
    >
      {feedback.type ===
        "success" && (
        <Check
          size={15}
          aria-hidden="true"
        />
      )}

      {feedback.message}
    </p>
  );
}
