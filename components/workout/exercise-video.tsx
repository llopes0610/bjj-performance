"use client";

import { useState } from "react";

import {
  LoaderCircle,
  Play,
  Video,
} from "lucide-react";

import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "@/lib/exercises/youtube";

interface ExerciseVideoProps {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  exerciseName: string;
}

/*
 * Mostra primeiro a thumbnail. O iframe do YouTube só é
 * montado depois do toque, então nada carrega do YouTube
 * enquanto o usuário não pedir o vídeo.
 */
export function ExerciseVideo({
  videoUrl,
  thumbnailUrl,
  exerciseName,
}: ExerciseVideoProps) {
  const [playing, setPlaying] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const embedUrl =
    getYouTubeEmbedUrl(videoUrl);

  const thumbnail =
    getYouTubeThumbnailUrl(
      videoUrl,
      thumbnailUrl
    );

  if (!embedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 sm:rounded-3xl">
        <div className="px-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 sm:h-14 sm:w-14">
            <Video
              size={22}
              className="text-zinc-500 sm:h-6 sm:w-6"
              aria-hidden="true"
            />
          </div>

          <p className="mt-3 text-sm font-medium text-zinc-300 sm:mt-4">
            Vídeo demonstrativo
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Em breve
          </p>
        </div>
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() =>
          setPlaying(true)
        }
        aria-label={`Reproduzir vídeo: ${exerciseName}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 sm:rounded-3xl"
      >
        {thumbnail && (
          // Thumbnail externa simples; não precisa do otimizador do Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
          />
        )}

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-active:scale-95">
            <Play
              size={24}
              className="ml-0.5"
              fill="currentColor"
              aria-hidden="true"
            />
          </span>
        </span>

        <span className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur sm:left-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
          <Play
            size={12}
            aria-hidden="true"
          />

          Demonstração
        </span>
      </button>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black sm:rounded-3xl">
      {loading && (
        <div
          role="status"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400"
        >
          <LoaderCircle
            size={28}
            className="animate-spin"
            aria-hidden="true"
          />

          <span className="text-xs">
            Carregando vídeo...
          </span>
        </div>
      )}

      <iframe
        src={embedUrl}
        title={`Execução: ${exerciseName}`}
        onLoad={() =>
          setLoading(false)
        }
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
