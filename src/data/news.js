import { parseMarkdownModule } from "./contentParserShared";

const modules = import.meta.glob("../content/news/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const toDateValue = (value) => {
  const date = new Date(String(value || "").trim());
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : -Infinity;
};

const toChineseDateLabel = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return `${year}年${month}月${day}日`;
  }
  const date = new Date(raw);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return raw;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

const toYearLabel = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4})/);
  if (!match) return raw;
  return `${match[1]} 年`;
};

const parseArticle = (raw, path) => {
  const {
    id,
    data,
    coverAsset,
    infoPanelHtml,
    customCarousels,
    bodyHtml,
  } = parseMarkdownModule({
    raw,
    path,
    defaultImageAlt: "新闻配图",
  });

  const infoTags = Array.isArray(data.infoTags) ? data.infoTags : [];
  const normalizedInfoTags = infoTags
    .filter(Boolean)
    .map((tag) => toYearLabel(tag));
  if (!normalizedInfoTags.length) {
    if (data.publishedAt) normalizedInfoTags.push(toYearLabel(data.publishedAt));
    if (data.category) normalizedInfoTags.push(String(data.category));
  }
  const orderedInfoTags = [
    ...normalizedInfoTags.filter((tag) => /^\d{4}\s*年?$/.test(String(tag).trim())),
    ...normalizedInfoTags.filter((tag) => !/^\d{4}\s*年?$/.test(String(tag).trim())),
  ];

  return {
    id,
    title: data.title || "",
    sidebarTitle: data.sidebarTitle || data.title || "",
    publishedAt: toChineseDateLabel(data.publishedAt),
    publishedAtRaw: String(data.publishedAt || "").trim(),
    publishedTimestamp: toDateValue(data.publishedAt),
    year: String(data.publishedAt || "").slice(0, 4),
    startMonth: String(data.publishedAt || "").slice(5, 7),
    category: data.category || "",
    tag: data.category || "",
    lead: data.lead || "",
    cover: coverAsset.src,
    coverSrcSet: coverAsset.srcSet,
    primaryButtonText: data.primaryButtonText || "",
    primaryButtonUrl: data.primaryButtonUrl || "",
    secondaryButtonText: data.secondaryButtonText || "",
    secondaryButtonUrl: data.secondaryButtonUrl || "",
    infoTags: orderedInfoTags,
    infoPanelHtml,
    customCarousels,
    bodyHtml,
  };
};

const newsArticles = Object.entries(modules).reduce((acc, [path, raw]) => {
  const article = parseArticle(raw, path);
  acc[article.id] = article;
  return acc;
}, {});

const newsList = Object.values(newsArticles);

export { newsArticles, newsList };
