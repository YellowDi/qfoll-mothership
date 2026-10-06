/**
 * [INPUT]: 依赖 ./inlineVideo 的 createVideoUi/syncUi/菜单、播放控制、全屏与视口判据，DOM 视频节点、IntersectionObserver 与浏览器事件
 * [OUTPUT]: 对外提供 initInlineVideoPlayers(root)，返回清理函数；收尾时暂停并卸载全部 source、移除控制层与监听
 * [POS]: 详情内容交互层的媒体控制核心与编排者：持有「当前应播放哪一个」的全局裁决 (scheduleSync) 与轨道宽高比共享，把可见度观察、视频事件和控制层交互接线到 inlineVideo 的无状态能力上
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import {
  closeMoreMenu,
  createVideoUi,
  openMoreMenu,
  syncUi,
} from "./inlineVideo/ui";
import {
  applyVideoAspectRatio,
  copyVideoLink,
  ensureVideoSource,
  pausePlayer,
  playPlayer,
  rememberResumeTime,
  restoreResumeTime,
  setHostVideoState,
  toggleFullscreen,
  unloadVideoSource,
} from "./inlineVideo/playback";
import {
  normalizeViewportAfterFullscreenExit,
  restoreInlineVideoPresentation,
} from "./inlineVideo/fullscreen";
import {
  getPlayableScore,
  isPlayable,
  TRACK_THRESHOLDS,
  VIEWPORT_THRESHOLDS,
} from "./inlineVideo/viewport";
import type { InlinePlayer } from "./inlineVideo/types";

const addEvent = (
  disposers: Array<() => void>,
  target: EventTarget,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions
) => {
  target.addEventListener(type, handler, options);
  disposers.push(() => target.removeEventListener(type, handler, options));
};

export const initInlineVideoPlayers = (root: unknown): (() => void) => {
  if (!(root instanceof HTMLElement)) return () => {};

  const videos = Array.from(
    root.querySelectorAll<HTMLVideoElement>(".md-carousel-video[data-inline-video='true']")
  );
  if (!videos.length) return () => {};

  const disposers: Array<() => void> = [];
  const players: InlinePlayer[] = [];
  const playerByHost = new Map<Element, InlinePlayer>();
  const trackObserverByTrack = new Map<HTMLElement, IntersectionObserver>();
  const trackAspectRatio = new Map<HTMLElement | null, string>(); // null 键只用于查询 (无轨道的视频)，不会被写入
  let activePlayer: InlinePlayer | null = null;
  let rafId: number | null = null;
  let isDestroyed = false;

  const setTrackAspectRatio = (track: HTMLElement | null, ratio: string) => {
    if (!track || !ratio) return;
    trackAspectRatio.set(track, ratio);
    players.forEach((player) => {
      if (player.track !== track) return;
      player.host.style.aspectRatio = ratio;
      player.host.style.setProperty("--md-video-ar", ratio);
      player.aspectRatio = ratio;
    });
  };

  const scheduleSync = () => {
    if (isDestroyed || rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      if (isDestroyed) return;

      if (document.hidden) {
        players.forEach((player) => {
          pausePlayer(player);
        });
        activePlayer = null;
        return;
      }

      let bestPlayer = null as InlinePlayer | null; // forEach 闭包内赋值，TS 流分析看不到
      let bestScore = -Infinity;

      players.forEach((player) => {
        if (!isPlayable(player)) {
          if (player.viewportRatio <= 0.01 || !player.userPaused) {
            pausePlayer(player);
          }
          return;
        }
        const score = getPlayableScore(player);
        if (score > bestScore) {
          bestScore = score;
          bestPlayer = player;
        }
      });

      if (!bestPlayer) {
        players.forEach((player) => {
          pausePlayer(player);
        });
        activePlayer = null;
        return;
      }

      activePlayer = bestPlayer;
      const activeRatio =
        bestPlayer.aspectRatio || trackAspectRatio.get(bestPlayer.track) || "";
      if (activeRatio) {
        setTrackAspectRatio(bestPlayer.track, activeRatio);
      }

      players.forEach((player) => {
        if (player === bestPlayer) {
          ensureVideoSource(player);
          if (player.userPaused) {
            pausePlayer(player);
          } else {
            playPlayer(player, { enforceMuted: true });
          }
          return;
        }
        pausePlayer(player);
      });
    });
  };

  const viewportObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const player = playerByHost.get(entry.target);
        if (!player) return;
        player.viewportRatio = entry.intersectionRatio;
      });
      scheduleSync();
    },
    { threshold: VIEWPORT_THRESHOLDS }
  );

  const ensureTrackObserver = (track: HTMLElement) => {
    const existing = trackObserverByTrack.get(track);
    if (existing) return existing;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const player = playerByHost.get(entry.target);
          if (!player) return;
          player.trackRatio = entry.intersectionRatio;
        });
        scheduleSync();
      },
      { root: track, threshold: TRACK_THRESHOLDS }
    );
    trackObserverByTrack.set(track, observer);
    return observer;
  };

  videos.forEach((video, index) => {
    const host = video.closest<HTMLElement>(".md-carousel-item-video");
    if (!host) return;
    const track = video.closest<HTMLElement>(".md-carousel-track");
    const player: InlinePlayer = {
      id: `inline-video-${index}`,
      video,
      host,
      track,
      viewportRatio: 0,
      trackRatio: track ? 0 : 1,
      userPaused: false,
      menuOpen: false,
      menuView: "main",
      scrubbing: false,
      hideTimer: null,
      copyTimer: null,
      sourceUrl: video.dataset.src || "",
      sourceLoaded: false,
      hasFirstFrame: false,
      aspectRatio: "",
      resumeTime: 0,
      pendingResumeTime: false,
      ui: createVideoUi(host),
    };
    players.push(player);
    playerByHost.set(host, player);
    const knownTrackRatio = track ? trackAspectRatio.get(track) : undefined;
    if (knownTrackRatio) {
      player.aspectRatio = knownTrackRatio;
      host.style.aspectRatio = knownTrackRatio;
      host.style.setProperty("--md-video-ar", knownTrackRatio);
    }

    video.defaultMuted = true;
    video.muted = true;
    video.controls = false;
    video.loop = true;
    video.preload = "none";
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.removeAttribute("src");
    setHostVideoState(player);

    viewportObserver.observe(host);
    if (track) {
      ensureTrackObserver(track).observe(host);
    }

    addEvent(disposers, video, "loadstart", () => {
      player.hasFirstFrame = false;
      setHostVideoState(player);
      syncUi(player);
    });
    addEvent(disposers, video, "loadeddata", () => {
      player.hasFirstFrame = true;
      setHostVideoState(player);
      syncUi(player);
    });
    addEvent(disposers, video, "loadedmetadata", () => {
      const ratio = applyVideoAspectRatio(player);
      if (ratio) {
        setTrackAspectRatio(player.track, ratio);
      }
      restoreResumeTime(player);
      syncUi(player);
    });
    addEvent(disposers, video, "progress", () => syncUi(player));
    addEvent(disposers, video, "play", () => syncUi(player));
    addEvent(disposers, video, "pause", () => {
      rememberResumeTime(player);
      syncUi(player);
    });
    addEvent(disposers, video, "timeupdate", () => {
      rememberResumeTime(player);
      syncUi(player);
    });
    addEvent(disposers, video, "durationchange", () => syncUi(player));
    addEvent(disposers, video, "volumechange", () => syncUi(player));
    addEvent(disposers, video, "ratechange", () => syncUi(player));
    addEvent(disposers, video, "webkitbeginfullscreen", () => syncUi(player));
    addEvent(disposers, video, "webkitendfullscreen", () => {
      restoreInlineVideoPresentation(player);
      const ratio = applyVideoAspectRatio(player);
      if (ratio) {
        setTrackAspectRatio(player.track, ratio);
      }
      syncUi(player);
      scheduleSync();
      normalizeViewportAfterFullscreenExit();
      window.setTimeout(normalizeViewportAfterFullscreenExit, 140);
      window.setTimeout(normalizeViewportAfterFullscreenExit, 320);
      window.dispatchEvent(new CustomEvent("inline-video-fullscreen-end"));
    });
    addEvent(disposers, video, "canplay", () => {
      if (!player.hasFirstFrame) {
        player.hasFirstFrame = true;
        setHostVideoState(player);
      }
      restoreResumeTime(player);
      syncUi(player);
    });
    addEvent(disposers, video, "emptied", () => {
      player.hasFirstFrame = false;
      setHostVideoState(player);
      syncUi(player);
    });
    addEvent(disposers, video, "error", () => {
      player.hasFirstFrame = false;
      setHostVideoState(player);
      syncUi(player);
    });
    const stopPropagation = (event: Event) => {
      event.stopPropagation();
    };
    addEvent(disposers, player.ui.layer, "click", stopPropagation);
    addEvent(disposers, player.ui.layer, "pointerdown", stopPropagation);

    const togglePlayback = () => {
      if (video.paused || video.ended) {
        if (video.ended) {
          video.currentTime = 0;
          player.resumeTime = 0;
        }
        player.userPaused = false;
        activePlayer = player;
        players.forEach((item) => {
          if (item === player) return;
          item.userPaused = false;
          pausePlayer(item);
        });
        playPlayer(player, { enforceMuted: true });
      } else {
        player.userPaused = true;
        pausePlayer(player);
      }
      scheduleSync();
    };

    addEvent(disposers, player.ui.centerBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePlayback();
    });

    addEvent(disposers, player.ui.playBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePlayback();
    });

    addEvent(disposers, player.ui.progress, "pointerdown", () => {
      player.scrubbing = true;
      player.host.classList.add("is-ui-visible");
    });

    addEvent(disposers, player.ui.progress, "input", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const ratio = Number(player.ui.progress.value) / 1000;
      if (duration > 0) {
        video.currentTime = ratio * duration;
        rememberResumeTime(player);
      }
      syncUi(player);
    });

    addEvent(disposers, player.ui.progress, "change", () => {
      player.scrubbing = false;
      scheduleSync();
    });

    addEvent(disposers, player.ui.muteBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) {
        video.volume = 0.6;
      }
      syncUi(player);
    });

    addEvent(disposers, player.ui.fullscreenBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFullscreen(player);
      syncUi(player);
    });

    addEvent(disposers, player.ui.moreBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (player.menuOpen) {
        closeMoreMenu(player);
      } else {
        openMoreMenu(players, player);
      }
      syncUi(player);
    });

    addEvent(disposers, player.ui.speedEntryBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      player.menuView = "speed";
      player.ui.moreMenu.dataset.view = "speed";
      syncUi(player);
    });

    addEvent(disposers, player.ui.speedBackBtn, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      player.menuView = "main";
      player.ui.moreMenu.dataset.view = "main";
      syncUi(player);
    });

    player.ui.speedButtons.forEach((button) => {
      addEvent(disposers, button, "click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const speed = Number(button.dataset.speed || "1");
        if (Number.isFinite(speed) && speed > 0) {
          video.playbackRate = speed;
          syncUi(player);
        }
      });
    });

    addEvent(disposers, player.ui.copyBtn, "click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        await copyVideoLink(player);
        player.ui.copyBtn.textContent = "已复制";
      } catch {
        player.ui.copyBtn.textContent = "复制失败";
      }
      if (player.copyTimer) window.clearTimeout(player.copyTimer);
      player.copyTimer = window.setTimeout(() => {
        player.ui.copyBtn.textContent = "复制链接";
      }, 1200);
    });

    addEvent(disposers, host, "touchstart", () => {
      host.classList.add("is-ui-visible");
      if (player.hideTimer) window.clearTimeout(player.hideTimer);
      player.hideTimer = window.setTimeout(() => {
        if (!player.menuOpen) host.classList.remove("is-ui-visible");
      }, 2400);
    });

    addEvent(disposers, host, "mouseleave", () => {
      if (player.hideTimer) {
        window.clearTimeout(player.hideTimer);
        player.hideTimer = null;
      }
      closeMoreMenu(player);
      host.classList.remove("is-ui-visible");
    });

    syncUi(player);
  });

  const uniqueTracks = new Set(
    players.map((player) => player.track).filter((track): track is HTMLElement => track !== null)
  );
  uniqueTracks.forEach((track) => {
    const onScroll = () => scheduleSync();
    addEvent(disposers, track, "scroll", onScroll, { passive: true });
  });

  addEvent(disposers, window, "scroll", scheduleSync, { passive: true });
  addEvent(disposers, window, "resize", scheduleSync, { passive: true });
  addEvent(disposers, document, "visibilitychange", scheduleSync);
  addEvent(disposers, document, "fullscreenchange", () => {
    players.forEach((player) => syncUi(player));
  });
  addEvent(disposers, document, "webkitfullscreenchange", () => {
    players.forEach((player) => syncUi(player));
  });
  addEvent(disposers, document, "pointerdown", (event) => {
    players.forEach((player) => {
      if (!player.menuOpen) return;
      if (!player.ui.moreWrap.contains(event.target as Node | null)) {
        closeMoreMenu(player);
      }
    });
  });

  trackObserverByTrack.forEach((observer) => observer.takeRecords());
  scheduleSync();

  return () => {
    isDestroyed = true;
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    players.forEach((player) => {
      if (player.hideTimer) window.clearTimeout(player.hideTimer);
      if (player.copyTimer) window.clearTimeout(player.copyTimer);
      pausePlayer(player);
      unloadVideoSource(player);
      closeMoreMenu(player);
      player.host.classList.remove("is-ui-visible");
      player.ui.layer.remove();
    });
    viewportObserver.disconnect();
    trackObserverByTrack.forEach((observer) => observer.disconnect());
    disposers.splice(0).forEach((dispose) => dispose());
  };
};
