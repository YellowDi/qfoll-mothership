const VIEWPORT_THRESHOLDS = [0, 0.15, 0.35, 0.55, 0.75, 1];
const TRACK_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const MIN_VIEWPORT_RATIO = 0.35;
const MIN_TRACK_RATIO = 0.5;
const CENTER_RING_RADIUS = 28;
const CENTER_RING_LENGTH = 2 * Math.PI * CENTER_RING_RADIUS;
const CENTER_RING_ARC = CENTER_RING_LENGTH * 0.36;

const formatVideoTime = (seconds) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const copyText = async (text) => {
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

const addEvent = (disposers, target, type, handler, options) => {
  target.addEventListener(type, handler, options);
  disposers.push(() => target.removeEventListener(type, handler, options));
};

const createIconButton = (className, iconClass, label) => {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.setAttribute("aria-label", label);
  const icon = document.createElement("i");
  icon.className = iconClass;
  button.appendChild(icon);
  return { button, icon };
};

const isElementFullscreen = (element) => {
  const active = document.fullscreenElement || document.webkitFullscreenElement;
  return active === element;
};

const getPlayableScore = (player) => {
  const rect = player.host.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const viewportCenter = viewportHeight / 2;
  const cardCenter = rect.top + rect.height / 2;
  const centerDistance = Math.abs(cardCenter - viewportCenter) / viewportCenter;
  const centerScore = 1 - Math.min(centerDistance, 1.4);
  return player.viewportRatio * 2 + player.trackRatio * 2.4 + centerScore * 0.6;
};

const isPlayable = (player) =>
  player.viewportRatio >= MIN_VIEWPORT_RATIO && player.trackRatio >= MIN_TRACK_RATIO;

const setHostVideoState = (player) => {
  player.host.classList.toggle("is-video-placeholder", !player.sourceLoaded);
  player.host.classList.toggle(
    "is-video-loading",
    player.sourceLoaded && !player.hasFirstFrame
  );
  player.host.classList.toggle("is-video-ready", player.hasFirstFrame);
};

const rememberResumeTime = (player) => {
  if (!player.sourceLoaded) return;
  const current = Number(player.video.currentTime);
  if (!Number.isFinite(current) || current <= 0) return;
  player.resumeTime = current;
};

const restoreResumeTime = (player) => {
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

const applyVideoAspectRatio = (player) => {
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

const createVideoUi = (player) => {
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

  const speedButtons = ["0.5", "1", "1.25", "1.5", "2"].map((rate) => {
    const button = document.createElement("button");
    button.className = "md-video-menu-item";
    button.type = "button";
    button.dataset.speed = rate;
    button.textContent = `${rate}x`;
    moreMenu.appendChild(button);
    return button;
  });

  const copyBtn = document.createElement("button");
  copyBtn.className = "md-video-menu-item";
  copyBtn.type = "button";
  copyBtn.dataset.action = "copy-link";
  copyBtn.textContent = "复制链接";
  moreMenu.appendChild(copyBtn);

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
  player.host.appendChild(layer);

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
    speedButtons,
    copyBtn,
  };
};

const syncUi = (player) => {
  const { video, ui } = player;
  if (!ui) return;

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
  ui.fullscreenIcon.className = isElementFullscreen(player.host)
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

const closeMoreMenu = (player) => {
  if (!player.menuOpen) return;
  player.menuOpen = false;
  player.ui.moreWrap.classList.remove("is-open");
  player.ui.moreBtn.setAttribute("aria-expanded", "false");
};

const openMoreMenu = (players, player) => {
  players.forEach((item) => {
    if (item !== player) closeMoreMenu(item);
  });
  player.menuOpen = true;
  player.ui.moreWrap.classList.add("is-open");
  player.ui.moreBtn.setAttribute("aria-expanded", "true");
  player.host.classList.add("is-ui-visible");
};

const ensureVideoSource = (player) => {
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

const unloadVideoSource = (player) => {
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

const pausePlayer = (player) => {
  if (!player.video.paused) {
    player.video.pause();
  }
  syncUi(player);
};

const playPlayer = (player, { enforceMuted = false } = {}) => {
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
  const playTask = player.video.play();
  if (playTask && typeof playTask.catch === "function") {
    playTask.catch(() => {});
  }
  syncUi(player);
};

const copyVideoLink = async (player) => {
  const url = new URL(window.location.href);
  const videoId = player.video.dataset.videoId || player.id;
  url.searchParams.set("video", videoId);
  url.searchParams.set(
    "t",
    String(Math.max(0, Math.floor(Number(player.video.currentTime) || 0)))
  );
  await copyText(url.toString());
};

const toggleFullscreen = (player) => {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (fullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (typeof exit === "function") {
      const task = exit.call(document);
      if (task && typeof task.catch === "function") task.catch(() => {});
    }
    return;
  }
  const request = player.host.requestFullscreen || player.host.webkitRequestFullscreen;
  if (typeof request === "function") {
    const task = request.call(player.host);
    if (task && typeof task.catch === "function") task.catch(() => {});
  }
};

export const initInlineVideoPlayers = (root) => {
  if (!(root instanceof HTMLElement)) return () => {};

  const videos = Array.from(
    root.querySelectorAll(".md-carousel-video[data-inline-video='true']")
  );
  if (!videos.length) return () => {};

  const disposers = [];
  const players = [];
  const playerByHost = new Map();
  const trackObserverByTrack = new Map();
  const trackAspectRatio = new Map();
  let activePlayer = null;
  let rafId = null;
  let isDestroyed = false;

  const setTrackAspectRatio = (track, ratio) => {
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

      let bestPlayer = null;
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

  const ensureTrackObserver = (track) => {
    if (trackObserverByTrack.has(track)) {
      return trackObserverByTrack.get(track);
    }
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
    const host = video.closest(".md-carousel-item-video");
    if (!host) return;
    const track = video.closest(".md-carousel-track");
    const player = {
      id: `inline-video-${index}`,
      video,
      host,
      track,
      viewportRatio: 0,
      trackRatio: track ? 0 : 1,
      userPaused: false,
      menuOpen: false,
      scrubbing: false,
      hideTimer: null,
      copyTimer: null,
      sourceUrl: video.dataset.src || "",
      sourceLoaded: false,
      hasFirstFrame: false,
      aspectRatio: "",
      resumeTime: 0,
      pendingResumeTime: false,
      ui: null,
    };
    player.ui = createVideoUi(player);
    players.push(player);
    playerByHost.set(host, player);
    const knownTrackRatio = trackAspectRatio.get(track);
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
    const stopPropagation = (event) => {
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
    players.map((player) => player.track).filter(Boolean)
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
      if (!player.ui.moreWrap.contains(event.target)) {
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
      player.ui?.layer?.remove();
    });
    viewportObserver.disconnect();
    trackObserverByTrack.forEach((observer) => observer.disconnect());
    disposers.splice(0).forEach((dispose) => dispose());
  };
};
