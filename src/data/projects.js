import { parseMarkdownModule } from "./contentParserShared";

const modules = import.meta.glob("../content/projects/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const toYearLabel = (value) => {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";
  const match = rawValue.match(/^(\d{4})\s*年?$/);
  if (!match) return rawValue;
  return `${match[1]} 年`;
};

const parseProject = (raw, path) => {
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
    defaultImageAlt: "项目展示图",
  });

  const infoTags = Array.isArray(data.infoTags) ? data.infoTags : [];
  const normalizedInfoTags = infoTags
    .filter(Boolean)
    .map((tag) => toYearLabel(tag));
  if (!normalizedInfoTags.length) {
    if (data.year) normalizedInfoTags.push(toYearLabel(data.year));
    if (data.tag) normalizedInfoTags.push(String(data.tag));
  }
  const orderedInfoTags = [
    ...normalizedInfoTags.filter((tag) => /^\d{4}\s*年?$/.test(String(tag).trim())),
    ...normalizedInfoTags.filter((tag) => !/^\d{4}\s*年?$/.test(String(tag).trim())),
  ];

  return {
    id,
    title: data.title || "",
    sidebarTitle: data.sidebarTitle || data.title || "",
    year: data.year || "",
    yearLabel: toYearLabel(data.year),
    startMonth: data.startMonth || "",
    company: data.company || "",
    tag: data.tag || "",
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

const projects = Object.entries(modules).reduce((acc, [path, raw]) => {
  const project = parseProject(raw, path);
  acc[project.id] = project;
  return acc;
}, {});

const projectList = Object.values(projects);

export { projects, projectList };
