import MarkdownIt from "markdown-it";
import { resolveCoverAsset } from "./coverAssets";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const modules = import.meta.glob("../content/projects/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const parseValue = (value) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseArray = (lines, startIndex, indent) => {
  const arr = [];
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const currentIndent = line.match(/^ */)[0].length;
    if (currentIndent < indent || !line.trim().startsWith("- ")) {
      break;
    }
    const itemText = line.trim().slice(2);
    i += 1;
    if (itemText.includes(":")) {
      const [key, rest] = itemText.split(/:\s(.+)/);
      const objItem = { [key.trim()]: parseValue(rest || "") };
      while (i < lines.length) {
        const nextLine = lines[i];
        if (!nextLine.trim()) {
          i += 1;
          continue;
        }
        const nextIndent = nextLine.match(/^ */)[0].length;
        if (nextIndent <= currentIndent) break;
        const trimmed = nextLine.trim();
        if (trimmed.includes(":")) {
          const [k, v] = trimmed.split(/:\s(.+)/);
          objItem[k.trim()] = parseValue(v || "");
        }
        i += 1;
      }
      arr.push(objItem);
    } else {
      arr.push(parseValue(itemText));
    }
  }
  return { value: arr, index: i };
};

const parseFrontmatter = (raw) => {
  if (!raw.startsWith("---")) {
    return { data: {}, content: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, content: raw };
  }
  const fm = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trim();
  const lines = fm.split("\n");
  const data = {};
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      i += 1;
      continue;
    }
    const [key, rest] = trimmed.split(/:\s(.*)/);
    if (rest === undefined || rest === "") {
      i += 1;
      while (i < lines.length && !lines[i].trim()) i += 1;
      if (i >= lines.length) {
        data[key.trim()] = [];
        break;
      }
      const nextLine = lines[i];
      const nextIndent = nextLine.match(/^ */)[0].length;
      if (nextLine.trim().startsWith("- ")) {
        const parsed = parseArray(lines, i, nextIndent);
        data[key.trim()] = parsed.value;
        i = parsed.index;
      } else {
        data[key.trim()] = parseValue(nextLine.trim());
        i += 1;
      }
    } else {
      data[key.trim()] = parseValue(rest);
      i += 1;
    }
  }
  return { data, content };
};

const escapeAttr = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;");

const toBackgroundImage = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.includes("url(") || raw.includes("linear-gradient(")) {
    return raw;
  }
  return `url("${raw}")`;
};

const isCssBackgroundExpression = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return raw.includes("url(") || raw.includes("gradient(");
};

const parseBlockLines = (block) =>
  block
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length);

const parseWideCarouselBlock = (block) => {
  const lines = parseBlockLines(block);
  const slides = [];
  let current = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (Object.keys(current).length) slides.push(current);
      current = {};
      const text = trimmed.slice(2).trim();
      if (text.startsWith("image:")) {
        current.image = parseValue(text.replace("image:", ""));
      }
      if (text.startsWith("video:")) {
        current.video = parseValue(text.replace("video:", ""));
      }
      if (text.startsWith("caption:")) {
        current.caption = parseValue(text.replace("caption:", ""));
      }
    } else if (trimmed.startsWith("image:")) {
      current.image = parseValue(trimmed.replace("image:", ""));
    } else if (trimmed.startsWith("video:")) {
      current.video = parseValue(trimmed.replace("video:", ""));
    } else if (trimmed.startsWith("caption:")) {
      current.caption = parseValue(trimmed.replace("caption:", ""));
    }
  });
  if (Object.keys(current).length) slides.push(current);
  return slides.filter((slide) => slide.image || slide.video);
};

const renderSlide = (slide, carouselId, idx) => {
  const caption = `<div class="md-item-caption">${escapeAttr(slide.caption || "")}</div>`;
  if (slide.video) {
    return `<div class="md-carousel-card is-video is-landscape"><div class="md-carousel-item md-carousel-item-video" data-carousel-id="${carouselId}" data-index="${idx}"><video class="md-carousel-video" data-inline-video="true" data-video-id="${escapeAttr(
      `${carouselId}-${idx}`
    )}" data-src="${escapeAttr(
      slide.video
    )}" muted playsinline preload="none"></video></div>${caption}</div>`;
  }
  const imageSource = String(slide.image ?? "").trim();
  if (!imageSource) {
    return `<div class="md-carousel-card is-landscape"><div class="md-carousel-item md-carousel-item-bg" data-carousel-id="${carouselId}" data-index="${idx}"></div>${caption}</div>`;
  }
  if (isCssBackgroundExpression(imageSource)) {
    const background = toBackgroundImage(imageSource);
    return `<div class="md-carousel-card is-landscape"><div class="md-carousel-item md-carousel-item-bg" data-carousel-id="${carouselId}" data-index="${idx}" style="background-image:${escapeAttr(
      background
    )}"></div>${caption}</div>`;
  }
  return `<div class="md-carousel-card is-landscape"><div class="md-carousel-item md-carousel-item-image" data-carousel-id="${carouselId}" data-index="${idx}"><img class="md-carousel-image" src="${escapeAttr(
    imageSource
  )}" alt="${escapeAttr(slide.caption || "项目展示图")}" loading="lazy" decoding="async" /></div>${caption}</div>`;
};

const renderSlidesHtml = (slides, carouselId) =>
  slides.map((slide, idx) => renderSlide(slide, carouselId, idx)).join("");

const parseProject = (raw, path) => {
  const { data, content } = parseFrontmatter(raw);
  const id = data.id || path.split("/").pop()?.replace(".md", "");
  let body = content || "";
  let infoPanelHtml = "";
  const infoMatch = body.match(/:::info-panel\n([\s\S]*?)\n:::/);
  if (infoMatch) {
    infoPanelHtml = md.render(infoMatch[1].trim());
    body = body.replace(infoMatch[0], "");
  }

  const customCarousels = [];
  let carouselIndex = 0;

  body = body.replace(/\[\[media\|([^\]]+)\]\]/g, (_m, payload) => {
    const parts = payload
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    const slides = parts.map((part) => {
      const [img, cap = ""] = part.split("|");
      return { image: parseValue(img || ""), caption: parseValue(cap || "") };
    });
    const carouselId = `carousel-${id}-${carouselIndex}`;
    customCarousels.push({ id: carouselId, slides });
    const singleClass = slides.length <= 1 ? " is-single" : "";
    const controlsHtml =
      slides.length > 1
        ? '<div class="md-carousel-controls"><button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="prev"><i class="ri-arrow-left-line"></i></button><button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="next"><i class="ri-arrow-right-line"></i></button></div>'
        : "";
    const itemsHtml = renderSlidesHtml(slides, carouselId);
    carouselIndex += 1;
    return `\n\n<div class="md-media${singleClass}" data-carousel-id="${carouselId}">${controlsHtml}<div class="md-carousel-track" data-carousel-track="true">${itemsHtml}</div></div>\n\n`;
  });
  body = body.replace(/:::media\n([\s\S]*?)\n:::/g, (_m, block) => {
    const slides = parseWideCarouselBlock(block);
    const carouselId = `carousel-${id}-${carouselIndex}`;
    customCarousels.push({ id: carouselId, slides });
    const singleClass = slides.length <= 1 ? " is-single" : "";
    const controlsHtml =
      slides.length > 1
        ? '<div class="md-carousel-controls"><button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="prev"><i class="ri-arrow-left-line"></i></button><button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="next"><i class="ri-arrow-right-line"></i></button></div>'
        : "";
    const itemsHtml = renderSlidesHtml(slides, carouselId);
    carouselIndex += 1;
    return `<div class="md-media${singleClass}" data-carousel-id="${carouselId}">${controlsHtml}<div class="md-carousel-track" data-carousel-track="true">${itemsHtml}</div></div>`;
  });

  const infoTags = Array.isArray(data.infoTags) ? data.infoTags : [];
  const toYearLabel = (value) => {
    const rawValue = String(value ?? "").trim();
    if (!rawValue) return "";
    const match = rawValue.match(/^(\d{4})\s*年?$/);
    if (!match) return rawValue;
    return `${match[1]} 年`;
  };
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

  const coverAsset = resolveCoverAsset(data.cover || "");

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
    bodyHtml: md.render(body || ""),
  };
};

const projects = Object.entries(modules).reduce((acc, [path, raw]) => {
  const project = parseProject(raw, path);
  acc[project.id] = project;
  return acc;
}, {});

const projectList = Object.values(projects);

export { projects, projectList };
