import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { exerciseCatalog } from "../../data/exercises/catalog";

import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
} from "./youtube";

const ID = "GutQSsdFxPE";

describe("getYouTubeVideoId", () => {
  it("aceita os formatos oficiais", () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&t=10s`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}`,
      `https://youtu.be/${ID}?si=abc`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `  https://www.youtube.com/watch?v=${ID}  `,
    ]) {
      assert.equal(getYouTubeVideoId(url), ID, url);
    }
  });

  it("recusa hosts falsos e protocolos inseguros", () => {
    for (const url of [
      `https://youtube.com.site-falso.com/watch?v=${ID}`,
      `https://falsoyoutube.com/watch?v=${ID}`,
      `https://www.youtube.com.evil.io/embed/${ID}`,
      `http://www.youtube.com/watch?v=${ID}`,
      `javascript:alert(1)//www.youtube.com/watch?v=${ID}`,
      `https://user:pass@www.youtube.com/watch?v=${ID}`,
      `https://www.youtube.com:8443/watch?v=${ID}`,
      `data:text/html,<iframe src="https://youtu.be/${ID}">`,
    ]) {
      assert.equal(getYouTubeVideoId(url), null, url);
    }
  });

  it("recusa IDs e caminhos inválidos", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=curto",
      `https://www.youtube.com/watch?v=${ID}x`,
      `https://www.youtube.com/watch?v=${ID.slice(0, 10)}"`,
      "https://www.youtube.com/watch",
      `https://www.youtube.com/channel/${ID}`,
      `https://youtu.be/${ID}/extra`,
      "https://youtu.be/",
      "",
      "não é url",
      null,
      undefined,
    ]) {
      assert.equal(getYouTubeVideoId(url), null, String(url));
    }
  });
});

describe("getYouTubeEmbedUrl", () => {
  it("gera embed sem autoplay", () => {
    const embed = getYouTubeEmbedUrl(`https://youtu.be/${ID}`);

    assert.equal(
      embed,
      `https://www.youtube-nocookie.com/embed/${ID}?rel=0&playsinline=1`
    );
    assert.ok(!embed?.includes("autoplay"));
  });

  it("nunca devolve a URL original", () => {
    assert.equal(getYouTubeEmbedUrl("https://exemplo.com/video.mp4"), null);
  });
});

describe("getYouTubeThumbnailUrl", () => {
  const videoUrl = `https://www.youtube.com/watch?v=${ID}`;

  it("usa a thumbnail cadastrada do CDN do YouTube", () => {
    assert.equal(
      getYouTubeThumbnailUrl(videoUrl, `https://i.ytimg.com/vi/${ID}/mqdefault.jpg`),
      `https://i.ytimg.com/vi/${ID}/mqdefault.jpg`
    );
  });

  it("deriva do ID quando a thumbnail falta ou é de outro host", () => {
    const derived = `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`;

    assert.equal(getYouTubeThumbnailUrl(videoUrl, null), derived);
    assert.equal(getYouTubeThumbnailUrl(videoUrl, "https://evil.com/x.jpg"), derived);
  });

  it("não gera thumbnail sem vídeo válido", () => {
    assert.equal(getYouTubeThumbnailUrl(null, `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`), null);
  });
});

describe("catálogo de exercícios", () => {
  it("todos os exercícios têm vídeo e thumbnail válidos e coerentes", () => {
    for (const exercise of exerciseCatalog) {
      const videoId = getYouTubeVideoId(exercise.videoUrl);

      assert.ok(videoId, exercise.slug);
      assert.equal(
        exercise.thumbnailUrl,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        exercise.slug
      );
    }
  });
});
