/**
 * [INPUT]: 依赖详情正文 DOM、浏览器剪贴板和路由详情键
 * [OUTPUT]: 对外提供分享复制、代码复制、媒体轮播与内联视频生命周期
 * [POS]: React 详情页共享的浏览器交互编排层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState, type RefObject } from "react";

type Options = { markdownRef: RefObject<HTMLElement | null>; contentKey: string };

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const input = document.createElement("textarea");
  input.value = text; input.style.position = "fixed"; input.style.opacity = "0";
  document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove();
}

export function useReactDetailPageInteractions({ markdownRef, contentKey }: Options) {
  const [copiedVisible, setCopiedVisible] = useState(false);
  useEffect(() => {
    const root = markdownRef.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const copy = target.closest<HTMLButtonElement>(".md-code-copy");
      if (copy) {
        event.preventDefault();
        const code = copy.closest(".md-code-block")?.querySelector(".md-code-pre code")?.textContent || "";
        if (code.trim()) void writeClipboard(code).then(() => { copy.dataset.copied = "true"; const label = copy.querySelector(".md-code-copy-text"); if (label) label.textContent = "已复制"; window.setTimeout(() => { copy.dataset.copied = "false"; if (label) label.textContent = "复制"; }, 1400); });
        return;
      }
      const button = target.closest<HTMLElement>(".md-carousel-btn");
      if (!button) return;
      const track = button.closest(".md-media")?.querySelector<HTMLElement>(".md-carousel-track");
      if (!track) return;
      const cards = Array.from(track.querySelectorAll<HTMLElement>(".md-carousel-card"));
      const current = Number(track.dataset.activeIndex || 0);
      const next = button.dataset.action === "prev" ? current - 1 : current + 1;
      const index = (next + cards.length) % cards.length;
      track.dataset.activeIndex = String(index);
      cards[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    };
    root.addEventListener("click", onClick);
    const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video[data-autoplay], .md-media video"));
    videos.forEach((video) => { const source = video.dataset.src; if (source && !video.src) video.src = source; });
    const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((entry) => { const video = entry.target as HTMLVideoElement; if (entry.isIntersecting) void video.play().catch(() => undefined); else video.pause(); }), { threshold: 0.25 }) : null;
    videos.forEach((video) => observer?.observe(video));
    return () => { root.removeEventListener("click", onClick); observer?.disconnect(); };
  }, [markdownRef, contentKey]);
  const copyShareLink = async () => { try { await writeClipboard(window.location.href); setCopiedVisible(true); window.setTimeout(() => setCopiedVisible(false), 1400); } catch { setCopiedVisible(false); } };
  return { copiedVisible, copyShareLink };
}
