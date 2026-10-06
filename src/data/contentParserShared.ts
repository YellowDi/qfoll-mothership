/**
 * [INPUT]: 依赖 markdown-it、highlight.js 与 Mermaid 解析能力
 * [OUTPUT]: 对外提供 parseMarkdownModule，返回 ParsedMarkdown
 * [POS]: 项目、新闻和设计规范页面共享的内容转换边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { resolveCoverAsset } from "./coverAssets";
import type { CarouselSlide, CustomCarousel, Frontmatter, ParsedMarkdown } from "./types";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const parseValue = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/* 仅统计前导空格 (不含 tab)，该正则必然匹配 */
const indentOf = (line: string) => /^ */.exec(line)![0].length;

const parseArray = (
  lines: string[],
  startIndex: number,
  indent: number
): { value: Array<string | Record<string, string>>; index: number } => {
  const arr: Array<string | Record<string, string>> = [];
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const currentIndent = indentOf(line);
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
        const nextIndent = indentOf(nextLine);
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

const parseFrontmatter = (raw: string): { data: Frontmatter; content: string } => {
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
  const data: Frontmatter = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
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
      const nextIndent = indentOf(nextLine);
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

const escapeAttr = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;");

const normalizeCodeLanguage = (value: unknown) => {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return "text";
  const language = trimmed.split(/\s+/)[0].replace(/^language-/, "");
  return language || "text";
};

const highlightCode = (code: string, language: string, hasExplicitLanguage: boolean) => {
  const source = String(code || "");
  const normalized = normalizeCodeLanguage(language);
  if (!source) {
    return { language: normalized, html: "" };
  }
  if (hasExplicitLanguage && normalized !== "text" && hljs.getLanguage(normalized)) {
    try {
      return {
        language: normalized,
        html: hljs.highlight(source, {
          language: normalized,
          ignoreIllegals: true,
        }).value,
      };
    } catch {
      return { language: normalized, html: md.utils.escapeHtml(source) };
    }
  }
  if (!hasExplicitLanguage) {
    try {
      const detected = hljs.highlightAuto(source);
      return {
        language: detected.language || "text",
        html: detected.value,
      };
    } catch {
      return { language: "text", html: md.utils.escapeHtml(source) };
    }
  }
  return { language: normalized, html: md.utils.escapeHtml(source) };
};

const renderMarkdownCodeBlock = (code: string, language: string) => {
  const rawInfo = String(language || "").trim();
  const hasExplicitLanguage = rawInfo.length > 0;
  const normalizedLang = normalizeCodeLanguage(rawInfo);
  if (hasExplicitLanguage && normalizedLang === "mermaid") {
    const trimmed = code.trim();
    return `<div class="md-mermaid-block"><div class="mermaid" data-mermaid-src="${escapeAttr(trimmed)}">${md.utils.escapeHtml(trimmed)}</div></div>`;
  }
  const highlighted = highlightCode(code, rawInfo, hasExplicitLanguage);
  const lang = highlighted.language || normalizeCodeLanguage(rawInfo);
  return `<div class="md-code-block" data-code-lang="${escapeAttr(
    lang
  )}"><div class="md-code-toolbar"><span class="md-code-meta"><span class="md-code-icon" aria-hidden="true"><i class="ri-code-s-slash-line"></i></span><span class="md-code-lang">${escapeAttr(
    lang
  )}</span></span><button class="md-code-copy" type="button" aria-label="复制代码"><i class="ri-file-copy-line" aria-hidden="true"></i><span class="md-code-copy-text">复制</span></button></div><pre class="md-code-pre"><code class="language-${escapeAttr(
    lang
  )} hljs">${highlighted.html}</code></pre></div>`;
};

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  return renderMarkdownCodeBlock(token.content, token.info);
};

md.renderer.rules.code_block = (tokens, idx) => {
  const token = tokens[idx];
  return renderMarkdownCodeBlock(token.content, "text");
};

const toBackgroundImage = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.includes("url(") || raw.includes("linear-gradient(")) {
    return raw;
  }
  return `url("${raw}")`;
};

const isCssBackgroundExpression = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return raw.includes("url(") || raw.includes("gradient(");
};

const parseBlockLines = (block: string) =>
  block
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length);

const parseWideCarouselBlock = (block: string): CarouselSlide[] => {
  const lines = parseBlockLines(block);
  const slides: CarouselSlide[] = [];
  let current: CarouselSlide = {};
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

const renderSlide = (
  slide: CarouselSlide,
  carouselId: string,
  idx: number,
  defaultImageAlt: string
) => {
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
  )}" alt="${escapeAttr(
    slide.caption || defaultImageAlt
  )}" loading="lazy" decoding="async" /></div>${caption}</div>`;
};

const renderSlidesHtml = (slides: CarouselSlide[], carouselId: string, defaultImageAlt: string) =>
  slides
    .map((slide, idx) => renderSlide(slide, carouselId, idx, defaultImageAlt))
    .join("");

export const parseMarkdownModule = ({
  raw,
  path,
  defaultImageAlt,
}: {
  raw: string;
  path: string;
  defaultImageAlt: string;
}): ParsedMarkdown => {
  const { data, content } = parseFrontmatter(raw);
  const id = data.id || path.split("/").pop()!.replace(".md", "");
  let body = content || "";
  let infoPanelHtml = "";
  const infoMatch = body.match(/:::info-panel\n([\s\S]*?)\n:::/);
  if (infoMatch) {
    infoPanelHtml = md.render(infoMatch[1].trim());
    body = body.replace(infoMatch[0], "");
  }

  const customCarousels: CustomCarousel[] = [];
  let carouselIndex = 0;

  body = body.replace(/\[\[media\|([^\]]+)\]\]/g, (_m, payload: string) => {
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
    const itemsHtml = renderSlidesHtml(slides, carouselId, defaultImageAlt);
    carouselIndex += 1;
    return `\n\n<div class="md-media${singleClass}" data-carousel-id="${carouselId}">${controlsHtml}<div class="md-carousel-track" data-carousel-track="true">${itemsHtml}</div></div>\n\n`;
  });

  body = body.replace(/:::media\n([\s\S]*?)\n:::/g, (_m, block: string) => {
    const slides = parseWideCarouselBlock(block);
    const carouselId = `carousel-${id}-${carouselIndex}`;
    customCarousels.push({ id: carouselId, slides });
    const singleClass = slides.length <= 1 ? " is-single" : "";
    const controlsHtml =
      slides.length > 1
        ? '<div class="md-carousel-controls"><button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="prev"><i class="ri-arrow-left-line"></i></button><button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="next"><i class="ri-arrow-right-line"></i></button></div>'
        : "";
    const itemsHtml = renderSlidesHtml(slides, carouselId, defaultImageAlt);
    carouselIndex += 1;
    return `<div class="md-media${singleClass}" data-carousel-id="${carouselId}">${controlsHtml}<div class="md-carousel-track" data-carousel-track="true">${itemsHtml}</div></div>`;
  });

  return {
    id,
    data,
    coverAsset: resolveCoverAsset(data.cover || ""),
    infoPanelHtml,
    customCarousels,
    bodyHtml: md.render(body || ""),
  };
};
