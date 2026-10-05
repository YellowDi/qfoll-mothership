/**
 * [INPUT]: 依赖详情 Markdown DOM、浏览器剪贴板、Mermaid、内联视频控制器和主题状态
 * [OUTPUT]: 对外提供分享复制、代码复制、表格增强、媒体轮播、Mermaid 与内联视频生命周期
 * [POS]: React 详情正文的共享浏览器交互编排层，补齐 Vue 正文增强链路
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState, type RefObject } from "react";
import { initInlineVideoPlayers } from "../../composables/useInlineVideoPlayers";
import { useTheme } from "../providers/ThemeProvider";

type Options = { markdownRef: RefObject<HTMLElement | null>; contentKey: string };
type CarouselCard = HTMLElement;

const MERMAID_FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, "PingFang SC", sans-serif';
const MERMAID_THEME_LIGHT = {
  theme: "base" as const,
  themeVariables: {
    darkMode: false,
    fontFamily: MERMAID_FONT,
    fontSize: "15px",
    background: "#fafafa",
    primaryColor: "#f0f4f8",
    primaryTextColor: "#1f2937",
    primaryBorderColor: "#e5e7eb",
    secondaryColor: "#e8eef4",
    secondaryTextColor: "#374151",
    secondaryBorderColor: "#d1d5db",
    tertiaryColor: "#e2e8f0",
    tertiaryTextColor: "#4b5563",
    lineColor: "#9ca3af",
    textColor: "#1f2937",
  },
};
const MERMAID_THEME_DARK = {
  theme: "base" as const,
  themeVariables: {
    darkMode: true,
    fontFamily: MERMAID_FONT,
    fontSize: "15px",
    background: "#1a1a1e",
    primaryColor: "#2a2a2e",
    primaryTextColor: "#e5e7eb",
    primaryBorderColor: "#3f3f46",
    secondaryColor: "#27272a",
    secondaryTextColor: "#d4d4d8",
    secondaryBorderColor: "#52525b",
    tertiaryColor: "#3f3f46",
    tertiaryTextColor: "#a1a1aa",
    lineColor: "#71717a",
    textColor: "#e5e7eb",
  },
};

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function normalizeIndex(index: number, length: number) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

function getDesiredCenter(root: HTMLElement, track: HTMLElement) {
  const textBlock = root.querySelector<HTMLElement>(".markdown-body > *:not(.md-media)");
  const textRect = textBlock?.getBoundingClientRect();
  const trackRect = track.getBoundingClientRect();
  return textRect ? textRect.left + textRect.width / 2 - trackRect.left : track.clientWidth / 2;
}

function classifyCarouselCards(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".md-carousel-card").forEach((card) => {
    if (card.querySelector(".md-carousel-item-video")) {
      card.classList.remove("is-portrait");
      card.classList.add("is-video", "is-landscape");
      return;
    }
    const image = card.querySelector(".md-carousel-image");
    if (!(image instanceof HTMLImageElement) || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      card.classList.remove("is-video", "is-portrait");
      card.classList.add("is-landscape");
      return;
    }
    const portrait = image.naturalHeight > image.naturalWidth;
    card.classList.remove("is-video");
    card.classList.toggle("is-portrait", portrait);
    card.classList.toggle("is-landscape", !portrait);
  });
}

function applyTrackEdgePadding(track: HTMLElement, cards: CarouselCard[], desiredCenter: number) {
  const first = cards[0];
  const last = cards[cards.length - 1];
  if (!first || !last) return;
  track.style.paddingLeft = `${Math.max(0, desiredCenter - first.offsetWidth / 2)}px`;
  track.style.paddingRight = `${Math.max(0, desiredCenter - last.offsetWidth / 2)}px`;
}

function scrollCarouselToIndex(root: HTMLElement, track: HTMLElement, cards: CarouselCard[], index: number) {
  if (!cards.length) return;
  const targetIndex = normalizeIndex(index, cards.length);
  const desiredCenter = getDesiredCenter(root, track);
  track.dataset.activeIndex = String(targetIndex);
  applyTrackEdgePadding(track, cards, desiredCenter);
  const target = cards[targetIndex];
  if (!target) return;
  track.scrollTo({
    left: Math.max(0, target.offsetLeft + target.offsetWidth / 2 - desiredCenter),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

function alignCarousels(root: HTMLElement) {
  classifyCarouselCards(root);
  root.querySelectorAll<HTMLElement>(".md-media").forEach((mediaNode) => {
    const availableWidth = [
      mediaNode.clientWidth,
      mediaNode.parentElement?.clientWidth ?? 0,
      root.clientWidth,
      root.parentElement?.clientWidth ?? 0,
    ].filter((value) => Number.isFinite(value) && value > 0);
    if (!availableWidth.length) return;
    const width = Math.min(...availableWidth);
    const peek = window.innerWidth <= 768 ? 22 : window.innerWidth <= 1024 ? 26 : 32;
    mediaNode.style.setProperty("--md-landscape-card-width", `${Math.max(260, Math.min(1103, width - peek * 2))}px`);
  });
  root.querySelectorAll<HTMLElement>(".md-carousel-track[data-carousel-track='true']").forEach((track) => {
    const cards = Array.from(track.querySelectorAll<CarouselCard>(".md-carousel-card"));
    if (!cards.length) return;
    const desiredCenter = getDesiredCenter(root, track);
    const currentIndex = Number.isInteger(Number(track.dataset.activeIndex))
      ? normalizeIndex(Number(track.dataset.activeIndex), cards.length)
      : 0;
    track.dataset.activeIndex = String(currentIndex);
    applyTrackEdgePadding(track, cards, desiredCenter);
    const target = cards[currentIndex] || cards[0];
    track.scrollLeft = Math.max(0, target.offsetLeft + target.offsetWidth / 2 - desiredCenter);
  });
}

function enhanceMarkdownTables(root: HTMLElement) {
  root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    if (table.closest(".md-media") || table.parentElement?.classList.contains("md-table")) return;
    const parent = table.parentElement;
    if (!parent) return;
    const wrapper = document.createElement("div");
    wrapper.className = "md-table";
    parent.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

async function renderMermaid(root: HTMLElement, isDark: boolean, force = false) {
  const containers = Array.from(root.querySelectorAll<HTMLElement>(".md-mermaid-block .mermaid"));
  if (!containers.length) return;
  try {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({ securityLevel: "loose", ...(isDark ? MERMAID_THEME_DARK : MERMAID_THEME_LIGHT) });
    const nodes: HTMLElement[] = [];
    containers.forEach((element) => {
      const source = element.dataset.mermaidSrc;
      if (!source) return;
      if (force || !element.querySelector("svg")) {
        element.textContent = source;
        element.removeAttribute("data-processed");
        nodes.push(element);
      }
    });
    if (nodes.length) await mermaid.run({ nodes, suppressErrors: true });
  } catch {
    // Mermaid 解析失败时保留原始语法文本，正文仍可阅读。
  }
}

export function useReactDetailPageInteractions({ markdownRef, contentKey }: Options) {
  const { isDark } = useTheme();
  const [copiedVisible, setCopiedVisible] = useState(false);

  useEffect(() => {
    const root = markdownRef.current;
    if (!root) return;
    let frame: number | null = null;
    let alignTimer: number | null = null;
    let alignSettleTimer: number | null = null;
    let copyTimer: number | null = null;
    let lastCopyButton: HTMLButtonElement | null = null;
    let disposeInlineVideoPlayers: (() => void) | null = null;
    const scheduleAlign = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        alignCarousels(root);
        if (alignTimer !== null) window.clearTimeout(alignTimer);
        alignTimer = window.setTimeout(() => alignCarousels(root), 80);
        if (alignSettleTimer !== null) window.clearTimeout(alignSettleTimer);
        alignSettleTimer = window.setTimeout(() => alignCarousels(root), 280);
      });
    };
    const setCopyButtonState = (button: HTMLButtonElement, copied: boolean) => {
      button.dataset.copied = copied ? "true" : "false";
      const label = button.querySelector(".md-code-copy-text");
      if (label) label.textContent = copied ? "已复制" : "复制";
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const copyButton = target.closest<HTMLButtonElement>(".md-code-copy");
      if (copyButton) {
        event.preventDefault();
        event.stopPropagation();
        const code = copyButton.closest(".md-code-block")?.querySelector(".md-code-pre code")?.textContent || "";
        if (!code.trim()) return;
        void writeClipboard(code).then(() => {
          if (lastCopyButton && lastCopyButton !== copyButton) setCopyButtonState(lastCopyButton, false);
          setCopyButtonState(copyButton, true);
          lastCopyButton = copyButton;
          if (copyTimer !== null) window.clearTimeout(copyTimer);
          copyTimer = window.setTimeout(() => {
            setCopyButtonState(copyButton, false);
            if (lastCopyButton === copyButton) lastCopyButton = null;
          }, 1400);
        }).catch(() => setCopyButtonState(copyButton, false));
        return;
      }
      const carouselButton = target.closest<HTMLElement>(".md-carousel-btn");
      if (carouselButton) {
        const track = carouselButton.closest(".md-media")?.querySelector<HTMLElement>(".md-carousel-track");
        if (!track) return;
        const cards = Array.from(track.querySelectorAll<CarouselCard>(".md-carousel-card"));
        const current = Number(track.dataset.activeIndex || 0);
        scrollCarouselToIndex(root, track, cards, carouselButton.dataset.action === "prev" ? current - 1 : current + 1);
        return;
      }
      if (target.closest(".md-video-ui")) return;
      const item = target.closest<HTMLElement>(".md-carousel-item");
      if (!item) return;
      const track = item.closest(".md-media")?.querySelector<HTMLElement>(".md-carousel-track");
      if (!track) return;
      const cards = Array.from(track.querySelectorAll<CarouselCard>(".md-carousel-card"));
      scrollCarouselToIndex(root, track, cards, Number(item.dataset.index || 0));
    };
    const onLoad = () => scheduleAlign();
    root.addEventListener("click", onClick, true);
    root.addEventListener("load", onLoad, true);
    enhanceMarkdownTables(root);
    scheduleAlign();
    void renderMermaid(root, isDark);
    disposeInlineVideoPlayers = initInlineVideoPlayers(root);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleAlign);
    resizeObserver?.observe(root);
    if (root.parentElement) resizeObserver?.observe(root.parentElement);
    window.addEventListener("resize", scheduleAlign, { passive: true });
    window.addEventListener("orientationchange", scheduleAlign, { passive: true });
    window.addEventListener("inline-video-fullscreen-end", scheduleAlign);
    return () => {
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("load", onLoad, true);
      window.removeEventListener("resize", scheduleAlign);
      window.removeEventListener("orientationchange", scheduleAlign);
      window.removeEventListener("inline-video-fullscreen-end", scheduleAlign);
      resizeObserver?.disconnect();
      disposeInlineVideoPlayers?.();
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (alignTimer !== null) window.clearTimeout(alignTimer);
      if (alignSettleTimer !== null) window.clearTimeout(alignSettleTimer);
      if (copyTimer !== null) window.clearTimeout(copyTimer);
      if (lastCopyButton) setCopyButtonState(lastCopyButton, false);
    };
  }, [markdownRef, contentKey, isDark]);

  const copyShareLink = async () => {
    try {
      await writeClipboard(window.location.href);
      setCopiedVisible(true);
      window.setTimeout(() => setCopiedVisible(false), 1400);
    } catch {
      setCopiedVisible(false);
    }
  };
  return { copiedVisible, copyShareLink };
}
