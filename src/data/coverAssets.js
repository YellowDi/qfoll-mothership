const coverImages = import.meta.glob("../assets/covers/*.webp", {
  eager: true,
  import: "default",
});

const coverSrcSets = import.meta.glob(
  "../assets/covers/*.webp?w=320;480;640;800;960;1200&format=webp&as=srcset",
  {
    eager: true,
    import: "default",
  }
);

const toPublicCoverPath = (fullPath) => {
  const fileName = String(fullPath || "").split("/").pop();
  return fileName ? `/covers/${fileName}` : "";
};

const COVER_BY_PATH = Object.fromEntries(
  Object.entries(coverImages)
    .map(([fullPath, src]) => {
      const publicPath = toPublicCoverPath(fullPath);
      if (!publicPath) return null;

      const srcSetPath = `${fullPath}?w=320;480;640;800;960;1200&format=webp&as=srcset`;
      const srcSet = coverSrcSets[srcSetPath] || "";
      return [publicPath, { src, srcSet }];
    })
    .filter(Boolean)
);

const extractCoverPath = (value) => {
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

export const resolveCoverAsset = (value) => {
  const coverPath = extractCoverPath(value);
  if (!coverPath) {
    return { src: "", srcSet: "" };
  }
  const mapped = COVER_BY_PATH[coverPath];
  if (mapped) return mapped;
  return { src: coverPath, srcSet: "" };
};
