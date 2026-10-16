"use client";

import {
  useEffect,
  useRef,
} from "react";

import { useRouter } from "next/navigation";

import {
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { GenerateProgramButton } from "@/components/workout/generate-program-button";

interface ProgramUpdatePromptProps {
  restrictionsChanged: boolean;
}

/*
 * Aparece depois de salvar uma edição do perfil que
 * afeta o treino, quando existe programa ativo. O
 * atleta escolhe entre gerar um novo programa
 * (recomeça na semana 1) ou manter o atual.
 */
export function ProgramUpdatePrompt({
  restrictionsChanged,
}: ProgramUpdatePromptProps) {
  const router = useRouter();

  const dialogRef =
    useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  function keepCurrentProgram() {
    dialogRef.current?.close();

    router.push("/profile");
    router.refresh();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="program-update-title"
      onCancel={(event) => {
        // Esc equivale a manter o programa atual.
        event.preventDefault();
        keepCurrentProgram();
      }}
      className="m-0 mt-auto w-full max-w-full rounded-t-3xl border border-b-0 border-border bg-card p-0 text-foreground backdrop:bg-black/70 sm:m-auto sm:max-w-md sm:rounded-3xl sm:border-b"
    >
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-xl",
            restrictionsChanged
              ? "bg-yellow-500/10 text-yellow-400"
              : "bg-primary/10 text-primary",
          ].join(" ")}
        >
          {restrictionsChanged ? (
            <ShieldAlert
              size={22}
              aria-hidden="true"
            />
          ) : (
            <RefreshCw
              size={22}
              aria-hidden="true"
            />
          )}
        </div>

        <h2
          id="program-update-title"
          className="mt-4 text-lg font-bold"
        >
          Perfil salvo. Gerar um novo
          programa?
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          {restrictionsChanged
            ? "Suas restrições mudaram. Recomendamos gerar um novo programa para que os exercícios respeitem sua condição atual."
            : "Você alterou dados que afetam o treino. O programa atual foi montado com os dados antigos."}
        </p>

        <p className="mt-2 text-sm leading-6 text-muted">
          Um novo programa recomeça na
          semana 1 e o streak semanal
          volta a contar do início. O
          histórico e o XP já
          conquistados continuam.
        </p>

        <GenerateProgramButton
          label="Gerar novo programa"
          className="mt-6 [&>button]:w-full"
        />

        <button
          type="button"
          onClick={keepCurrentProgram}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-primary/40 active:scale-[0.98]"
        >
          Manter programa atual
        </button>
      </div>
    </dialog>
  );
}
