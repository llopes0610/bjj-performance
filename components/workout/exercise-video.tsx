import {
  Play,
  Video,
} from "lucide-react";

interface ExerciseVideoProps {
  videoUrl?: string | null;
  exerciseName: string;
}

function getYouTubeEmbedUrl(
  url: string
) {
  try {
    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {
      const videoId =
        parsed.searchParams.get(
          "v"
        );

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (
      parsed.hostname ===
      "youtu.be"
    ) {
      const videoId =
        parsed.pathname.replace(
          "/",
          ""
        );

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return url;
  } catch {
    return null;
  }
}

export function ExerciseVideo({
  videoUrl,
  exerciseName,
}: ExerciseVideoProps) {
  if (!videoUrl) {
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

  const embedUrl =
    getYouTubeEmbedUrl(videoUrl);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black sm:rounded-3xl">
      <iframe
        src={embedUrl}
        title={`Execução: ${exerciseName}`}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur sm:left-4 sm:top-4 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
        <Play
          size={12}
          aria-hidden="true"
        />

        Demonstração
      </div>
    </div>
  );
}