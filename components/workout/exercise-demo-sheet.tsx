"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ListChecks,
  PlayCircle,
  Shield,
  X,
} from "lucide-react";

import { ExerciseVideo } from "@/components/workout/exercise-video";

interface ExerciseDemoSheetProps {
  exerciseName: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  instructions: readonly string[];
  commonErrors: readonly string[];
  bjjTransfer?: string | null;
}

/*
 * Botão "Ver execução" + gaveta com vídeo e orientações.
 *
 * Usa <dialog> nativo: fecha com o X, com Esc (ou o voltar do
 * Android) e tocando fora. O conteúdo só é montado com a gaveta
 * aberta, então existe no máximo um iframe do YouTube na página
 * e o vídeo para ao fechar. As séries ficam fora da gaveta e não
 * são afetadas.
 */
export function ExerciseDemoSheet({
  exerciseName,
  videoUrl,
  thumbnailUrl,
  instructions,
  commonErrors,
  bjjTransfer,
}: ExerciseDemoSheetProps) {
  const dialogRef =
    useRef<HTMLDialogElement>(null);

  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previousOverflow;
      };
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white active:scale-[0.98]"
      >
        <PlayCircle
          size={18}
          className="text-red-500"
          aria-hidden="true"
        />

        Ver execução
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`Execução: ${exerciseName}`}
        onClose={() =>
          setOpen(false)
        }
        onClick={(event) => {
          // Toque no fundo escurecido (fora do conteúdo).
          if (
            event.target ===
            event.currentTarget
          ) {
            setOpen(false);
          }
        }}
        className="m-0 mt-auto max-h-[92dvh] w-full max-w-full overflow-hidden rounded-t-3xl border border-b-0 border-zinc-800 bg-zinc-950 p-0 text-white backdrop:bg-black/70 sm:m-auto sm:max-w-xl sm:rounded-3xl sm:border-b"
      >
        {open && (
          <div className="flex max-h-[92dvh] flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2 sm:px-5">
              <h2 className="min-w-0 truncate text-base font-semibold">
                {exerciseName}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                aria-label="Fechar"
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <X
                  size={22}
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-5">
              <ExerciseVideo
                videoUrl={videoUrl}
                thumbnailUrl={
                  thumbnailUrl
                }
                exerciseName={
                  exerciseName
                }
              />

              {instructions.length >
                0 && (
                <SheetSection
                  icon={
                    <ListChecks
                      size={18}
                      className="text-red-500"
                      aria-hidden="true"
                    />
                  }
                  title="Como executar"
                >
                  <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-300">
                    {instructions.map(
                      (item) => (
                        <li key={item}>
                          {item}
                        </li>
                      )
                    )}
                  </ol>
                </SheetSection>
              )}

              {commonErrors.length >
                0 && (
                <SheetSection
                  icon={
                    <AlertTriangle
                      size={18}
                      className="text-yellow-500"
                      aria-hidden="true"
                    />
                  }
                  title="Erros comuns"
                >
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-300">
                    {commonErrors.map(
                      (item) => (
                        <li key={item}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </SheetSection>
              )}

              {bjjTransfer && (
                <SheetSection
                  icon={
                    <Shield
                      size={18}
                      className="text-blue-400"
                      aria-hidden="true"
                    />
                  }
                  title="Transferência para o BJJ"
                >
                  <p className="text-sm leading-6 text-zinc-300">
                    {bjjTransfer}
                  </p>
                </SheetSection>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function SheetSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h3>

      <div className="mt-3">
        {children}
      </div>
    </section>
  );
}
