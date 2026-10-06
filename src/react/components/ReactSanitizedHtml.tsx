/**
 * [INPUT]: 依赖 Markdown 解析结果、DOMPurify 和浏览器 DOMParser
 * [OUTPUT]: 对外提供 ReactSanitizedHtml，清洗并挂载正文 HTML
 * [POS]: React 详情内容的安全边界，保留媒体增强所需的原始 DOM 结构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import DOMPurify from "dompurify";
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";

type Props = {
  html?: string;
  className?: string;
};

const allowedTags = [
  "a", "abbr", "b", "blockquote", "br", "button", "code", "del", "div", "em", "figcaption", "figure",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "input", "li", "ol", "p", "pre", "s", "section",
  "small", "source", "span", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", "video",
];

const allowedAttrs = [
  "alt", "aria-hidden", "aria-label", "aria-valuemax", "aria-valuemin", "aria-valuenow", "aria-valuetext", "class", "colspan",
  "controls", "data-action", "data-carousel-id", "data-code-lang", "data-index", "data-inline-video", "data-mermaid-src", "data-src",
  "data-video-id", "decoding", "height", "href", "id", "loading", "max", "min", "muted", "playsinline", "poster", "preload",
  "rel", "role", "rowspan", "sizes", "src", "srcset", "step", "style", "target", "title", "type", "value", "width",
];

function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    ALLOW_DATA_ATTR: true,
    FORBID_ATTR: ["onerror", "onclick", "onload", "srcdoc"],
    FORBID_TAGS: ["base", "embed", "form", "iframe", "link", "meta", "object", "script", "style"],
    RETURN_TRUSTED_TYPE: false,
  });
}

export const ReactSanitizedHtml = forwardRef<HTMLDivElement, Props>(function ReactSanitizedHtml(
  { html = "", className },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);

  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement, []);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const parsed = new DOMParser().parseFromString(sanitizedHtml, "text/html");
    const nodes = Array.from(parsed.body.childNodes, (node) => document.importNode(node, true));
    root.replaceChildren(...nodes);
  }, [sanitizedHtml]);

  return <div ref={rootRef} className={className} />;
});
