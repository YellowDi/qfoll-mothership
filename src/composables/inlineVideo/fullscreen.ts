/**
 * [INPUT]: 依赖 ./types 的 InlinePlayer 与 WebKit 全屏类型，浏览器全屏 API 与 visualViewport
 * [OUTPUT]: 对外提供全屏状态判定 (isElementFullscreen/isVideoNativeFullscreen/canUseVideoNativeFullscreen)、restoreInlineVideoPresentation、normalizeViewportAfterFullscreenExit
 * [POS]: inlineVideo 的全屏知识层，不依赖播放与 UI 模块；iOS 原生全屏退出后的视口漂移补偿集中在此
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { InlinePlayer, WebkitDocument, WebkitVideo } from "./types";

export const isElementFullscreen = (element: Element) => {
  const doc = document as WebkitDocument;
  const active = doc.fullscreenElement || doc.webkitFullscreenElement;
  return active === element;
};

export const canUseVideoNativeFullscreen = (video: HTMLVideoElement) =>
  typeof (video as WebkitVideo)?.webkitEnterFullscreen === "function";

export const isVideoNativeFullscreen = (video: HTMLVideoElement) =>
  Boolean((video as WebkitVideo)?.webkitDisplayingFullscreen);

export const restoreInlineVideoPresentation = (player: InlinePlayer) => {
  const { video } = player;
  video.controls = false;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.removeAttribute("style");
};

/* 退出全屏后 iOS 会残留视口偏移或越界滚动：先夹取、再补偿 offsetTop、下一帧再轻推一次触发重绘 */
export const normalizeViewportAfterFullscreenExit = () => {
  const scrollRoot = document.scrollingElement || document.documentElement;
  if (!scrollRoot) return;

  const clampScrollTop = () => {
    const maxTop = Math.max(0, scrollRoot.scrollHeight - window.innerHeight);
    const currentTop = Number(window.scrollY || window.pageYOffset || 0);
    const safeTop = Number.isFinite(currentTop) ? currentTop : 0;
    if (safeTop < 0) {
      window.scrollTo(0, 0);
      return;
    }
    if (safeTop > maxTop) {
      window.scrollTo(0, maxTop);
    }
  };

  const applyViewportOffsetCompensation = () => {
    const offsetTop = Number(window.visualViewport?.offsetTop || 0);
    if (offsetTop > 0.5) {
      const currentTop = Number(window.scrollY || window.pageYOffset || 0);
      const maxTop = Math.max(0, scrollRoot.scrollHeight - window.innerHeight);
      const nextTop = Math.max(0, Math.min(maxTop, currentTop + offsetTop));
      window.scrollTo(0, nextTop);
    }
  };

  const nudgeRepaint = () => {
    const maxTop = Math.max(0, scrollRoot.scrollHeight - window.innerHeight);
    const currentTop = Number(window.scrollY || window.pageYOffset || 0);
    if (!Number.isFinite(currentTop)) return;
    if (currentTop < maxTop) {
      window.scrollTo(0, Math.min(maxTop, currentTop + 1));
    }
    window.scrollTo(0, Math.max(0, Math.min(maxTop, currentTop)));
  };

  clampScrollTop();
  applyViewportOffsetCompensation();
  window.requestAnimationFrame(() => {
    clampScrollTop();
    applyViewportOffsetCompensation();
    nudgeRepaint();
  });
};
