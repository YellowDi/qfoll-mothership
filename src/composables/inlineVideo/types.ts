/**
 * [INPUT]: 无运行时依赖，仅描述内联视频播放器的数据形状与 WebKit 私有全屏 API
 * [OUTPUT]: 对外提供 InlinePlayer、VideoUi、MenuView 与 WebkitDocument/WebkitVideo/WebkitElement 类型
 * [POS]: inlineVideo 子模块的类型边界；播放器状态是一份被各子模块原地读写的可变记录，这里是它的唯一定义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export type MenuView = "main" | "speed";

/* 视频控制层的 DOM 句柄，创建后不再替换 */
export interface VideoUi {
  layer: HTMLDivElement;
  centerBtn: HTMLButtonElement;
  centerIcon: HTMLElement;
  playBtn: HTMLButtonElement;
  playIcon: HTMLElement;
  timeLabel: HTMLSpanElement;
  progress: HTMLInputElement;
  muteBtn: HTMLButtonElement;
  muteIcon: HTMLElement;
  fullscreenBtn: HTMLButtonElement;
  fullscreenIcon: HTMLElement;
  moreWrap: HTMLDivElement;
  moreBtn: HTMLButtonElement;
  moreMenu: HTMLDivElement;
  speedEntryBtn: HTMLButtonElement;
  speedBackBtn: HTMLButtonElement;
  speedButtons: HTMLButtonElement[];
  copyBtn: HTMLButtonElement;
}

/* 单个内联视频的运行时状态：source 懒加载、可见度比例、菜单与定时器都挂在这里 */
export interface InlinePlayer {
  id: string;
  video: HTMLVideoElement;
  host: HTMLElement;
  track: HTMLElement | null;
  viewportRatio: number;
  trackRatio: number;
  userPaused: boolean;
  menuOpen: boolean;
  menuView: MenuView;
  scrubbing: boolean;
  hideTimer: number | null;
  copyTimer: number | null;
  sourceUrl: string;
  sourceLoaded: boolean;
  hasFirstFrame: boolean;
  aspectRatio: string;
  resumeTime: number;
  pendingResumeTime: boolean;
  ui: VideoUi;
}

/* WebKit 私有全屏 API：lib.dom 不收录，按实际探测用法声明为可选 */
export interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

export interface WebkitVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
}

export interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
