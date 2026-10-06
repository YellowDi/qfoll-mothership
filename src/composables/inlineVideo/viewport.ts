/**
 * [INPUT]: 依赖 ./types 的 InlinePlayer 可见度比例
 * [OUTPUT]: 对外提供 IntersectionObserver 阈值常量、MIN_*_RATIO 与 getPlayableScore/isPlayable
 * [POS]: inlineVideo 的"谁该播放"判据：视口可见度、轮播轨道可见度与居中程度加权，纯函数，不碰播放状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { InlinePlayer } from "./types";

export const VIEWPORT_THRESHOLDS = [0, 0.15, 0.35, 0.55, 0.75, 1];
export const TRACK_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const MIN_VIEWPORT_RATIO = 0.35;
const MIN_TRACK_RATIO = 0.5;

export const getPlayableScore = (player: InlinePlayer) => {
  const rect = player.host.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const viewportCenter = viewportHeight / 2;
  const cardCenter = rect.top + rect.height / 2;
  const centerDistance = Math.abs(cardCenter - viewportCenter) / viewportCenter;
  const centerScore = 1 - Math.min(centerDistance, 1.4);
  return player.viewportRatio * 2 + player.trackRatio * 2.4 + centerScore * 0.6;
};

export const isPlayable = (player: InlinePlayer) =>
  player.viewportRatio >= MIN_VIEWPORT_RATIO && player.trackRatio >= MIN_TRACK_RATIO;
