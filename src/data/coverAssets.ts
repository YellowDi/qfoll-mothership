/**
 * [INPUT]: 依赖静态媒体资源路径约定
 * [OUTPUT]: 对外提供 SQUARE_COVER_SIZES、resolveCoverAsset、resolveCoverVideoAsset
 * [POS]: 内容数据与 public/src assets 之间的资源适配层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { CoverAsset } from "./types";

const coverImages = import.meta.glob<string>("../assets/covers/*.webp", {
  eager: true,
  import: "default",
});

const coverSrcSets = import.meta.glob<string>(
  "../assets/covers/*.webp?w=320;480;640;800;960;1200&format=webp&as=srcset",
  {
    eager: true,
    import: "default",
  }
);

const coverVideos = import.meta.glob<string>("../assets/covers/*.{mp4,webm,mov,m4v}", {
  eager: true,
  import: "default",
});

const toPublicCoverPath = (fullPath: string) => {
  const fileName = String(fullPath || "").split("/").pop();
  return fileName ? `/covers/${fileName}` : "";
};

const COVER_BY_PATH: Record<string, CoverAsset> = Object.fromEntries(
  Object.entries(coverImages).flatMap(([fullPath, src]) => {
    const publicPath = toPublicCoverPath(fullPath);
    if (!publicPath) return [];

    const srcSetPath = `${fullPath}?w=320;480;640;800;960;1200&format=webp&as=srcset`;
    const srcSet = coverSrcSets[srcSetPath] || "";
    return [[publicPath, { src, srcSet }]];
  })
);

const COVER_VIDEO_BY_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(coverVideos).flatMap(([fullPath, src]) => {
    const publicPath = toPublicCoverPath(fullPath);
    return publicPath ? [[publicPath, src]] : [];
  })
);

const extractCoverPath = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const urlMatches = [...raw.matchAll(/url\((['"]?)(.*?)\1\)/g)];
  if (urlMatches.length) {
    return String(urlMatches[urlMatches.length - 1][2] || "").trim();
  }
  return raw;
};

export const SQUARE_COVER_SIZES =
  "(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw";

export const resolveCoverAsset = (value: unknown): CoverAsset => {
  const coverPath = extractCoverPath(value);
  if (!coverPath) {
    return { src: "", srcSet: "" };
  }
  const mapped = COVER_BY_PATH[coverPath];
  if (mapped) return mapped;
  return { src: coverPath, srcSet: "" };
};

export const resolveCoverVideoAsset = (value: unknown): string => {
  const videoPath = extractCoverPath(value);
  if (!videoPath) return "";
  const mapped = COVER_VIDEO_BY_PATH[videoPath];
  if (mapped) return mapped;
  return videoPath;
};
