import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

export const useDetailPageInteractions = ({
  watchSource,
  initInlineVideoPlayers,
}) => {
  const markdownRef = ref(null);
  const articleContentRef = ref(null);
  const copiedVisible = ref(false);
  let copiedTimer = null;
  let codeCopyTimer = null;
  let lastCodeCopyButton = null;
  let alignTimer = null;
  let alignSettleTimer = null;
  let disposeInlineVideoPlayers = null;
  let resizeObserver = null;

  const writeTextToClipboard = async (text) => {
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

  const copyShareLink = async () => {
    const text = window.location.href;
    try {
      await writeTextToClipboard(text);
      copiedVisible.value = true;
      if (copiedTimer) window.clearTimeout(copiedTimer);
      copiedTimer = window.setTimeout(() => {
        copiedVisible.value = false;
      }, 1400);
    } catch {
      copiedVisible.value = false;
    }
  };

  const setCodeCopyButtonState = (button, copied) => {
    button.dataset.copied = copied ? "true" : "false";
    const textNode = button.querySelector(".md-code-copy-text");
    if (textNode) {
      textNode.textContent = copied ? "已复制" : "复制";
    }
  };

  const handleCodeCopy = async (button) => {
    const block = button.closest(".md-code-block");
    const codeNode = block?.querySelector(".md-code-pre code");
    if (!(codeNode instanceof HTMLElement)) return;
    const text = codeNode.textContent || "";
    if (!text.trim()) return;
    try {
      await writeTextToClipboard(text);
      if (codeCopyTimer) window.clearTimeout(codeCopyTimer);
      if (lastCodeCopyButton && lastCodeCopyButton !== button) {
        setCodeCopyButtonState(lastCodeCopyButton, false);
      }
      setCodeCopyButtonState(button, true);
      lastCodeCopyButton = button;
      codeCopyTimer = window.setTimeout(() => {
        setCodeCopyButtonState(button, false);
        if (lastCodeCopyButton === button) {
          lastCodeCopyButton = null;
        }
      }, 1400);
    } catch {
      setCodeCopyButtonState(button, false);
    }
  };

  const handleMarkdownClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const copyButton = target.closest(".md-code-copy");
    if (copyButton instanceof HTMLButtonElement) {
      event.preventDefault();
      event.stopPropagation();
      void handleCodeCopy(copyButton);
      return;
    }
    const button = target.closest(".md-carousel-btn");
    if (button) {
      const action = button.dataset.action;
      const carousel = button.closest(".md-media");
      const track = carousel?.querySelector(".md-carousel-track");
      if (track) {
        const cards = Array.from(track.querySelectorAll(".md-carousel-card"));
        if (!cards.length) return;
        const targetIndex = getNextIndex(track, cards, action);
        scrollCarouselToIndex(track, cards, targetIndex);
      }
      return;
    }

    const item = target.closest(".md-carousel-item");
    if (item) {
      const carousel = item.closest(".md-media");
      const track = carousel?.querySelector(".md-carousel-track");
      if (!track) return;
      const cards = Array.from(track.querySelectorAll(".md-carousel-card"));
      if (!cards.length) return;
      const index = Number(item.dataset.index || 0);
      const currentIndex = getCurrentIndex(track, cards);
      if (index !== currentIndex) {
        event.preventDefault();
        event.stopPropagation();
        scrollCarouselToIndex(track, cards, index);
        return;
      }
      scrollCarouselToIndex(track, cards, index);
    }
  };

  const getDesiredCenter = (track) => {
    const textBlock = markdownRef.value?.querySelector(
      ".markdown-body > *:not(.md-media)"
    );
    const textRect = textBlock?.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    if (textRect) {
      return textRect.left + textRect.width / 2 - trackRect.left;
    }
    return track.clientWidth / 2;
  };

  const TRACK_ALIGN_LOCK_MS = 480;

  const getNow = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now();

  const normalizeIndex = (index, length) => {
    if (!length) return 0;
    return ((index % length) + length) % length;
  };

  const getStoredTrackIndex = (track, cards) => {
    if (!cards.length) return null;
    const raw = Number(track.dataset.activeIndex);
    if (!Number.isInteger(raw)) return null;
    if (raw < 0 || raw >= cards.length) return null;
    return raw;
  };

  const setTrackIndex = (track, index, length) => {
    if (!length) return;
    track.dataset.activeIndex = String(normalizeIndex(index, length));
  };

  const lockTrackAlign = (track) => {
    track.dataset.alignLockUntil = String(getNow() + TRACK_ALIGN_LOCK_MS);
  };

  const isTrackAlignLocked = (track) => {
    const lockUntil = Number(track.dataset.alignLockUntil || "0");
    return Number.isFinite(lockUntil) && lockUntil > getNow();
  };

  const resolveTrackIndex = (track, cards) => {
    const stored = getStoredTrackIndex(track, cards);
    if (stored !== null) return stored;
    setTrackIndex(track, 0, cards.length);
    return 0;
  };

  const getLandscapePeek = () => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    if (viewportWidth <= 768) return 22;
    if (viewportWidth <= 1024) return 26;
    return 32;
  };

  const getMediaAvailableWidth = (mediaNode) => {
    const widths = [
      mediaNode.clientWidth,
      mediaNode.parentElement?.clientWidth ?? 0,
      markdownRef.value?.clientWidth ?? 0,
      articleContentRef.value?.clientWidth ?? 0,
      mediaNode.closest("main")?.clientWidth ?? 0,
    ].filter((value) => Number.isFinite(value) && value > 0);
    if (!widths.length) return 0;
    return Math.min(...widths);
  };

  const syncMarkdownCarouselWidths = () => {
    if (!markdownRef.value) return;
    const mediaNodes = markdownRef.value.querySelectorAll(".md-media");
    const peek = getLandscapePeek();
    mediaNodes.forEach((mediaNode) => {
      const availableWidth = getMediaAvailableWidth(mediaNode);
      if (!availableWidth) return;
      const landscapeWidth = Math.max(
        260,
        Math.min(1103, availableWidth - peek * 2)
      );
      mediaNode.style.setProperty("--md-landscape-card-width", `${landscapeWidth}px`);
    });
  };

  const classifyMarkdownCarouselCards = () => {
    if (!markdownRef.value) return;
    const cards = markdownRef.value.querySelectorAll(".md-carousel-card");
    cards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      if (card.querySelector(".md-carousel-item-video")) {
        card.classList.remove("is-portrait");
        card.classList.add("is-video", "is-landscape");
        return;
      }
      const image = card.querySelector(".md-carousel-image");
      if (!(image instanceof HTMLImageElement)) {
        card.classList.remove("is-video", "is-portrait");
        card.classList.add("is-landscape");
        return;
      }
      if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        card.classList.remove("is-video", "is-portrait");
        card.classList.add("is-landscape");
        return;
      }
      const isPortrait = image.naturalHeight > image.naturalWidth;
      card.classList.remove("is-video");
      card.classList.toggle("is-portrait", isPortrait);
      card.classList.toggle("is-landscape", !isPortrait);
    });
  };

  const applyTrackEdgePadding = (track, cards, desiredCenter) => {
    const firstCard = cards[0];
    const lastCard = cards[cards.length - 1];
    if (!firstCard || !lastCard) return;
    const leftPadding = Math.max(0, desiredCenter - firstCard.offsetWidth / 2);
    const rightPadding = Math.max(0, desiredCenter - lastCard.offsetWidth / 2);
    track.style.paddingLeft = `${leftPadding}px`;
    track.style.paddingRight = `${rightPadding}px`;
  };

  const scrollCarouselToIndex = (track, cards, index) => {
    if (!cards.length) return;
    const targetIndex = normalizeIndex(index, cards.length);
    setTrackIndex(track, targetIndex, cards.length);
    lockTrackAlign(track);
    const desiredCenter = getDesiredCenter(track);
    applyTrackEdgePadding(track, cards, desiredCenter);
    const targetCard = cards[targetIndex];
    if (!targetCard) return;
    const targetCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
    const nextScrollLeft = Math.max(0, targetCenter - desiredCenter);
    track.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  };

  const getNextIndex = (track, cards, action) => {
    const currentIndex = getCurrentIndex(track, cards);
    if (action === "prev") {
      return (currentIndex - 1 + cards.length) % cards.length;
    }
    return (currentIndex + 1) % cards.length;
  };

  const getCurrentIndex = (track, cards, desiredCenter = getDesiredCenter(track)) => {
    const currentCenter = track.scrollLeft + desiredCenter;
    let currentIndex = 0;
    let minDelta = Infinity;
    cards.forEach((card, idx) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const delta = Math.abs(center - currentCenter);
      if (delta < minDelta) {
        minDelta = delta;
        currentIndex = idx;
      }
    });
    return currentIndex;
  };

  const alignMarkdownCarousels = () => {
    if (!markdownRef.value) return;
    classifyMarkdownCarouselCards();
    syncMarkdownCarouselWidths();
    const textBlock = markdownRef.value.querySelector(
      ".markdown-body > *:not(.md-media)"
    );
    const textRect = textBlock?.getBoundingClientRect();
    const tracks = markdownRef.value.querySelectorAll(
      ".md-carousel-track[data-carousel-track='true']"
    );
    tracks.forEach((track) => {
      if (isTrackAlignLocked(track)) return;
      const cards = Array.from(track.querySelectorAll(".md-carousel-card"));
      if (!cards.length) return;
      const trackRect = track.getBoundingClientRect();
      let desiredCenter = track.clientWidth / 2;
      if (textRect) {
        desiredCenter = textRect.left + textRect.width / 2 - trackRect.left;
      }
      const currentIndex = resolveTrackIndex(track, cards);
      applyTrackEdgePadding(track, cards, desiredCenter);
      const targetCard = cards[currentIndex] || cards[0];
      if (!targetCard) return;
      const targetCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
      const nextScrollLeft = Math.max(0, targetCenter - desiredCenter);
      track.scrollTo({ left: nextScrollLeft });
    });
  };

  const scheduleAlign = () => {
    requestAnimationFrame(() => {
      alignMarkdownCarousels();
      if (alignTimer) window.clearTimeout(alignTimer);
      alignTimer = window.setTimeout(() => {
        alignMarkdownCarousels();
      }, 80);
      if (alignSettleTimer) window.clearTimeout(alignSettleTimer);
      alignSettleTimer = window.setTimeout(() => {
        alignMarkdownCarousels();
      }, 280);
    });
  };

  const observeLayoutSize = () => {
    if (typeof ResizeObserver === "undefined") return;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    const targets = new Set();
    if (markdownRef.value) targets.add(markdownRef.value);
    if (articleContentRef.value) targets.add(articleContentRef.value);
    const mainNode =
      articleContentRef.value?.closest("main") ??
      markdownRef.value?.closest("main");
    if (mainNode) targets.add(mainNode);
    if (!targets.size) return;
    resizeObserver = new ResizeObserver(() => {
      scheduleAlign();
    });
    targets.forEach((target) => resizeObserver.observe(target));
  };

  const handleImageLoaded = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      scheduleAlign();
      return;
    }
    const track = target.closest(".md-carousel-track[data-carousel-track='true']");
    if (track instanceof HTMLElement && track.dataset.activeIndex !== undefined) {
      classifyMarkdownCarouselCards();
      syncMarkdownCarouselWidths();
      return;
    }
    scheduleAlign();
  };

  const mountInlineVideoPlayers = () => {
    if (disposeInlineVideoPlayers) {
      disposeInlineVideoPlayers();
      disposeInlineVideoPlayers = null;
    }
    if (!markdownRef.value) return;
    disposeInlineVideoPlayers = initInlineVideoPlayers(markdownRef.value);
  };

  onMounted(() => {
    if (markdownRef.value) {
      markdownRef.value.addEventListener("click", handleMarkdownClick, true);
      markdownRef.value.addEventListener("load", handleImageLoaded, true);
      scheduleAlign();
      mountInlineVideoPlayers();
      observeLayoutSize();
    }
    window.addEventListener("resize", scheduleAlign);
    window.addEventListener("orientationchange", scheduleAlign);
    window.addEventListener("inline-video-fullscreen-end", scheduleAlign);
  });

  watch(
    watchSource,
    async () => {
      await nextTick();
      scheduleAlign();
      mountInlineVideoPlayers();
      observeLayoutSize();
    }
  );

  onUnmounted(() => {
    if (markdownRef.value) {
      markdownRef.value.removeEventListener("click", handleMarkdownClick, true);
      markdownRef.value.removeEventListener("load", handleImageLoaded, true);
    }
    window.removeEventListener("resize", scheduleAlign);
    window.removeEventListener("orientationchange", scheduleAlign);
    window.removeEventListener("inline-video-fullscreen-end", scheduleAlign);
    if (disposeInlineVideoPlayers) {
      disposeInlineVideoPlayers();
      disposeInlineVideoPlayers = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (copiedTimer) window.clearTimeout(copiedTimer);
    if (codeCopyTimer) window.clearTimeout(codeCopyTimer);
    if (lastCodeCopyButton) {
      setCodeCopyButtonState(lastCodeCopyButton, false);
      lastCodeCopyButton = null;
    }
    if (alignTimer) window.clearTimeout(alignTimer);
    if (alignSettleTimer) window.clearTimeout(alignSettleTimer);
  });

  return {
    markdownRef,
    articleContentRef,
    copiedVisible,
    copyShareLink,
  };
};
