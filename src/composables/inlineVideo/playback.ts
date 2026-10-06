/**
 * [INPUT]: 依赖 ./types 的 InlinePlayer，./ui 的 syncUi，./fullscreen 的全屏判定与展示还原，浏览器 Clipboard/Fullscreen/视频元素 API
 * [OUTPUT]: 对外提供 setHostVideoState、rememberResumeTime、restoreResumeTime、applyVideoAspectRatio、ensureVideoSource、unloadVideoSource、pausePlayer、playPlayer、copyVideoLink、toggleFullscreen
 * [POS]: inlineVideo 的播放控制层：视频 source 懒加载/卸载与断点续播、播放暂停、复制带时间戳的分享链接、全屏切换；每次状态变更后调用 syncUi 回写视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import {
  canUseVideoNativeFullscreen,
  isVideoNativeFullscreen,
  restoreInlineVideoPresentation,
} from "./fullscreen";
import { syncUi } from "./ui";
import type { InlinePlayer, WebkitDocument, WebkitElement, WebkitVideo } from "./types";

/* 浏览器 API 可能返回 Promise 或 undefined：有 catch 才挂，吞掉被拒绝的结果 */
const ignoreRejection = (task: unknown) => {
  const thenable = task as { catch?: (onRejected: () => void) => unknown } | null | undefined;
  if (thenable && typeof thenable.catch === "function") thenable.catch(() => {});
};

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("input");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};

export const setHostVideoState = (player: InlinePlayer) => {
  player.host.classList.toggle("is-video-placeholder", !player.sourceLoaded);
  player.host.classList.toggle(
    "is-video-loading",
    player.sourceLoaded && !player.hasFirstFrame
  );
  player.host.classList.toggle("is-video-ready", player.hasFirstFrame);
};

export const rememberResumeTime = (player: InlinePlayer) => {
  if (!player.sourceLoaded) return;
  const current = Number(player.video.currentTime);
  if (!Number.isFinite(current) || current <= 0) return;
  player.resumeTime = current;
};

export const restoreResumeTime = (player: InlinePlayer) => {
  if (!player.pendingResumeTime || !player.sourceLoaded) return;
  const duration = Number(player.video.duration);
  if (!Number.isFinite(duration) || duration <= 0) return;
  const target = Math.min(player.resumeTime, Math.max(duration - 0.15, 0));
  if (target <= 0) {
    player.pendingResumeTime = false;
    return;
  }
  try {
    player.video.currentTime = target;
    player.pendingResumeTime = false;
  } catch {}
};

/* 返回已应用的宽高比；视频尺寸未知时返回空串，调用方据此跳过轨道比例同步 */
export const applyVideoAspectRatio = (player: InlinePlayer) => {
  const width = Number(player.video.videoWidth);
  const height = Number(player.video.videoHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "";
  }
  player.aspectRatio = `${width} / ${height}`;
  player.host.style.aspectRatio = player.aspectRatio;
  player.host.style.setProperty("--md-video-ar", player.aspectRatio);
  return player.aspectRatio;
};

export const ensureVideoSource = (player: InlinePlayer) => {
  if (player.sourceLoaded || !player.sourceUrl) return;
  player.video.src = player.sourceUrl;
  player.video.preload = "metadata";
  player.sourceLoaded = true;
  player.hasFirstFrame = false;
  player.pendingResumeTime = player.resumeTime > 0;
  setHostVideoState(player);
  player.video.load();
  syncUi(player);
};

export const unloadVideoSource = (player: InlinePlayer) => {
  if (!player.sourceLoaded) return;
  rememberResumeTime(player);
  if (!player.video.paused) {
    player.video.pause();
  }
  try {
    player.video.currentTime = 0;
  } catch {}
  player.video.removeAttribute("src");
  player.video.load();
  player.sourceLoaded = false;
  player.hasFirstFrame = false;
  player.pendingResumeTime = false;
  setHostVideoState(player);
  syncUi(player);
};

export const pausePlayer = (player: InlinePlayer) => {
  if (!player.video.paused) {
    player.video.pause();
  }
  syncUi(player);
};

export const playPlayer = (player: InlinePlayer, { enforceMuted = false } = {}) => {
  ensureVideoSource(player);
  if (!player.sourceLoaded) {
    syncUi(player);
    return;
  }
  if (!player.video.paused) {
    syncUi(player);
    return;
  }
  if (enforceMuted) {
    player.video.defaultMuted = true;
    player.video.muted = true;
  }
  ignoreRejection(player.video.play());
  syncUi(player);
};

export const copyVideoLink = async (player: InlinePlayer) => {
  const url = new URL(window.location.href);
  const videoId = player.video.dataset.videoId || player.id;
  url.searchParams.set("video", videoId);
  url.searchParams.set(
    "t",
    String(Math.max(0, Math.floor(Number(player.video.currentTime) || 0)))
  );
  await copyText(url.toString());
};

/* 优先级：已在页面全屏则退出 → 已在原生全屏则退出 → 支持原生全屏 (iOS) 则进入 → 否则请求宿主全屏 */
export const toggleFullscreen = (player: InlinePlayer) => {
  const { host } = player;
  const video = player.video as WebkitVideo;
  const doc = document as WebkitDocument;
  const fullscreenElement = doc.fullscreenElement || doc.webkitFullscreenElement;
  if (fullscreenElement) {
    const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
    if (typeof exit === "function") {
      ignoreRejection(exit.call(document));
    }
    return;
  }
  if (isVideoNativeFullscreen(video) && typeof video.webkitExitFullscreen === "function") {
    try {
      video.webkitExitFullscreen();
    } catch {}
    return;
  }
  if (canUseVideoNativeFullscreen(video)) {
    ensureVideoSource(player);
    restoreInlineVideoPresentation(player);
    try {
      video.webkitEnterFullscreen?.();
    } catch {}
    return;
  }
  const request = host.requestFullscreen || (host as WebkitElement).webkitRequestFullscreen;
  if (typeof request === "function") {
    ignoreRejection(request.call(host));
    return;
  }
};
