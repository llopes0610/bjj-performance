/*
 * Conversão segura de URLs do YouTube.
 *
 * Só aceitamos URLs https de hosts oficiais do YouTube e IDs
 * com o formato esperado (11 caracteres). Qualquer outra coisa
 * devolve null: nunca repassamos a URL original para um iframe.
 */

const VIDEO_ID_PATTERN =
  /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

const SHORT_HOST = "youtu.be";

const THUMBNAIL_HOSTS = new Set([
  "i.ytimg.com",
  "img.youtube.com",
]);

function parseHttpsUrl(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(
      value.trim()
    );

    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.port
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function validId(
  candidate: string | null | undefined
) {
  return candidate &&
    VIDEO_ID_PATTERN.test(candidate)
    ? candidate
    : null;
}

export function getYouTubeVideoId(
  url: string | null | undefined
): string | null {
  const parsed = parseHttpsUrl(url);

  if (!parsed) {
    return null;
  }

  const host =
    parsed.hostname.toLowerCase();

  const segments = parsed.pathname
    .split("/")
    .filter(Boolean);

  if (host === SHORT_HOST) {
    return segments.length === 1
      ? validId(segments[0])
      : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (
    segments.length === 1 &&
    segments[0] === "watch"
  ) {
    return validId(
      parsed.searchParams.get("v")
    );
  }

  if (
    segments.length === 2 &&
    (segments[0] === "embed" ||
      segments[0] === "shorts")
  ) {
    return validId(segments[1]);
  }

  return null;
}

/*
 * youtube-nocookie não grava cookies de rastreamento até o
 * usuário tocar o vídeo. Sem autoplay; playsinline evita que
 * o iOS abra tela cheia sozinho.
 */
export function getYouTubeEmbedUrl(
  url: string | null | undefined
): string | null {
  const videoId =
    getYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`;
}

/*
 * Usa a thumbnailUrl cadastrada somente se ela vier do CDN de
 * imagens do YouTube; caso contrário, deriva do ID do vídeo.
 */
export function getYouTubeThumbnailUrl(
  videoUrl: string | null | undefined,
  thumbnailUrl?: string | null
): string | null {
  const videoId =
    getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  const thumbnail =
    parseHttpsUrl(thumbnailUrl);

  if (
    thumbnail &&
    THUMBNAIL_HOSTS.has(
      thumbnail.hostname.toLowerCase()
    )
  ) {
    return thumbnail.toString();
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
