const parseYearTag = (tag) => {
  const match = String(tag || "").trim().match(/^(\d{4})\s*年?$/);
  return match ? Number(match[1]) : null;
};

const resolveTagTarget = (basePath, tag) => {
  const text = String(tag || "").trim();
  if (!text) return { path: basePath };
  const year = parseYearTag(text);
  if (year) {
    return { path: basePath, query: { years: String(year) } };
  }
  return { path: basePath, query: { tags: text } };
};

export const mapInfoTagsToLinks = (infoTags, basePath) =>
  (infoTags || []).map((tag) => ({
    label: tag,
    to: resolveTagTarget(basePath, tag),
  }));
