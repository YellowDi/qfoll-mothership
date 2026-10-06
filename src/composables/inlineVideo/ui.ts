/**
 * [INPUT]: 依赖 ./types 的 InlinePlayer/VideoUi，./fullscreen 的全屏状态判定
 * [OUTPUT]: 对外提供 createVideoUi、syncUi、closeMoreMenu、openMoreMenu
 * [POS]: inlineVideo 的控制层视图：一次性构建覆盖在视频上的 DOM，并把播放器状态单向同步成图标、时间、进度与菜单；不持有状态，不绑定事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { isElementFullscreen, isVideoNativeFullscreen } from "./fullscreen";
import type { InlinePlayer, VideoUi } from "./types";

const CENTER_RING_RADIUS = 28;
const CENTER_RING_LENGTH = 2 * Math.PI * CENTER_RING_RADIUS;
const CENTER_RING_ARC = CENTER_RING_LENGTH * 0.36;

const formatVideoTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const createIconButton = (className: string, iconClass: string, label: string) => {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.setAttribute("aria-label", label);
  const icon = document.createElement("i");
  icon.className = iconClass;
  button.appendChild(icon);
  return { button, icon };
};

/* 控制层只依赖宿主节点：创建即挂载到 host，由调用方在销毁时 layer.remove() */
export const createVideoUi = (host: HTMLElement): VideoUi => {
  const layer = document.createElement("div");
  layer.className = "md-video-ui";

  const centerBtn = document.createElement("button");
  centerBtn.className = "md-video-center-btn";
  centerBtn.type = "button";
  centerBtn.setAttribute("aria-label", "切换播放");

  const centerRing = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  centerRing.setAttribute("viewBox", "0 0 72 72");
  centerRing.setAttribute("aria-hidden", "true");
  centerRing.classList.add("md-video-center-ring");

  const centerRingProgress = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  centerRingProgress.setAttribute("cx", "36");
  centerRingProgress.setAttribute("cy", "36");
  centerRingProgress.setAttribute("r", String(CENTER_RING_RADIUS));
  centerRingProgress.classList.add("md-video-center-ring-progress");
  centerRingProgress.style.strokeDasharray = `${CENTER_RING_ARC} ${CENTER_RING_LENGTH}`;
  centerRingProgress.style.strokeDashoffset = "0";

  const centerIcon = document.createElement("i");
  centerIcon.className = "md-video-center-icon ri-play-fill";
  centerIcon.setAttribute("aria-hidden", "true");

  centerRing.appendChild(centerRingProgress);
  centerBtn.appendChild(centerRing);
  centerBtn.appendChild(centerIcon);

  const controlsShell = document.createElement("div");
  controlsShell.className = "md-video-controls-shell";
  const controlsBar = document.createElement("div");
  controlsBar.className = "md-video-controls";

  const { button: playBtn, icon: playIcon } = createIconButton(
    "md-video-btn inline-flex btn-icon btn-icon-sm",
    "ri-play-fill",
    "播放"
  );

  const timeLabel = document.createElement("span");
  timeLabel.className = "md-video-time";
  timeLabel.textContent = "00:00 / 00:00";

  const progress = document.createElement("input");
  progress.className = "md-video-progress";
  progress.type = "range";
  progress.min = "0";
  progress.max = "1000";
  progress.step = "1";
  progress.value = "0";
  progress.setAttribute("aria-label", "播放进度");

  const { button: muteBtn, icon: muteIcon } = createIconButton(
    "md-video-btn inline-flex btn-icon btn-icon-sm",
    "ri-volume-mute-fill",
    "取消静音"
  );

  const { button: fullscreenBtn, icon: fullscreenIcon } = createIconButton(
    "md-video-btn inline-flex btn-icon btn-icon-sm",
    "ri-fullscreen-line",
    "全屏"
  );

  const moreWrap = document.createElement("div");
  moreWrap.className = "md-video-more";
  const { button: moreBtn } = createIconButton(
    "md-video-btn inline-flex btn-icon btn-icon-sm",
    "ri-more-2-fill",
    "更多操作"
  );
  moreBtn.classList.add("md-video-more-trigger");
  moreBtn.setAttribute("aria-expanded", "false");

  const moreMenu = document.createElement("div");
  moreMenu.className = "md-video-more-menu";
  moreMenu.setAttribute("role", "menu");
  moreMenu.dataset.view = "main";

  const mainMenu = document.createElement("div");
  mainMenu.className = "md-video-more-panel md-video-more-main";

  const speedEntryBtn = document.createElement("button");
  speedEntryBtn.className = "md-video-menu-item has-submenu";
  speedEntryBtn.type = "button";
  speedEntryBtn.dataset.action = "open-speed-menu";
  speedEntryBtn.textContent = "播放速度";
  const speedEntryArrow = document.createElement("i");
  speedEntryArrow.className = "ri-arrow-right-s-line";
  speedEntryArrow.setAttribute("aria-hidden", "true");
  speedEntryBtn.appendChild(speedEntryArrow);
  mainMenu.appendChild(speedEntryBtn);

  const speedMenu = document.createElement("div");
  speedMenu.className = "md-video-more-panel md-video-more-speed";

  const speedBackBtn = document.createElement("button");
  speedBackBtn.className = "md-video-menu-item is-back";
  speedBackBtn.type = "button";
  speedBackBtn.dataset.action = "back-main-menu";
  speedBackBtn.textContent = "返回";
  const speedBackIcon = document.createElement("i");
  speedBackIcon.className = "ri-arrow-left-s-line";
  speedBackIcon.setAttribute("aria-hidden", "true");
  speedBackBtn.prepend(speedBackIcon);
  speedMenu.appendChild(speedBackBtn);

  const speedButtons = ["0.5", "1", "1.25", "1.5", "2"].map((rate) => {
    const button = document.createElement("button");
    button.className = "md-video-menu-item";
    button.type = "button";
    button.dataset.speed = rate;
    button.textContent = `${rate}x`;
    speedMenu.appendChild(button);
    return button;
  });

  const copyBtn = document.createElement("button");
  copyBtn.className = "md-video-menu-item";
  copyBtn.type = "button";
  copyBtn.dataset.action = "copy-link";
  copyBtn.textContent = "复制链接";
  mainMenu.appendChild(copyBtn);

  moreMenu.appendChild(mainMenu);
  moreMenu.appendChild(speedMenu);

  moreWrap.appendChild(moreBtn);
  moreWrap.appendChild(moreMenu);

  controlsBar.appendChild(playBtn);
  controlsBar.appendChild(timeLabel);
  controlsBar.appendChild(progress);
  controlsBar.appendChild(muteBtn);
  controlsBar.appendChild(fullscreenBtn);
  controlsBar.appendChild(moreWrap);
  controlsShell.appendChild(controlsBar);

  layer.appendChild(centerBtn);
  layer.appendChild(controlsShell);
  host.appendChild(layer);

  return {
    layer,
    centerBtn,
    centerIcon,
    playBtn,
    playIcon,
    timeLabel,
    progress,
    muteBtn,
    muteIcon,
    fullscreenBtn,
    fullscreenIcon,
    moreWrap,
    moreBtn,
    moreMenu,
    speedEntryBtn,
    speedBackBtn,
    speedButtons,
    copyBtn,
  };
};

export const syncUi = (player: InlinePlayer) => {
  const { video, ui } = player;

  const isPlaying = player.sourceLoaded && !video.paused && !video.ended;
  ui.centerIcon.className = `md-video-center-icon ${isPlaying ? "ri-pause-fill" : "ri-play-fill"}`;
  ui.playIcon.className = isPlaying ? "ri-pause-fill" : "ri-play-fill";
  ui.playBtn.setAttribute("aria-label", isPlaying ? "暂停" : "播放");

  const duration = player.sourceLoaded && Number.isFinite(video.duration) ? video.duration : 0;
  const current = player.sourceLoaded && Number.isFinite(video.currentTime) ? video.currentTime : 0;
  ui.timeLabel.textContent = `${formatVideoTime(current)} / ${formatVideoTime(duration)}`;
  if (!player.scrubbing) {
    const ratio = duration > 0 ? current / duration : 0;
    ui.progress.value = String(Math.max(0, Math.min(1000, Math.round(ratio * 1000))));
  }

  const isMuted = video.muted || video.volume === 0;
  ui.muteIcon.className = isMuted ? "ri-volume-mute-fill" : "ri-volume-up-fill";
  ui.muteBtn.setAttribute("aria-label", isMuted ? "取消静音" : "静音");
  ui.fullscreenIcon.className = isElementFullscreen(player.host) || isVideoNativeFullscreen(video)
    ? "ri-fullscreen-exit-line"
    : "ri-fullscreen-line";

  const currentRate = Number(video.playbackRate || 1);
  ui.speedButtons.forEach((button) => {
    const speed = Number(button.dataset.speed || "1");
    button.classList.toggle("is-active", Math.abs(speed - currentRate) < 0.01);
  });
  const isLoading = player.sourceLoaded && !player.hasFirstFrame;
  ui.centerBtn.classList.toggle("is-loading", isLoading);
};

export const closeMoreMenu = (player: InlinePlayer) => {
  if (!player.menuOpen) return;
  player.menuOpen = false;
  player.menuView = "main";
  player.ui.moreMenu.dataset.view = "main";
  player.ui.moreWrap.classList.remove("is-open");
  player.ui.moreBtn.setAttribute("aria-expanded", "false");
};

export const openMoreMenu = (players: InlinePlayer[], player: InlinePlayer) => {
  players.forEach((item) => {
    if (item !== player) closeMoreMenu(item);
  });
  player.menuOpen = true;
  player.menuView = "main";
  player.ui.moreMenu.dataset.view = "main";
  player.ui.moreWrap.classList.add("is-open");
  player.ui.moreBtn.setAttribute("aria-expanded", "true");
  player.host.classList.add("is-ui-visible");
};
