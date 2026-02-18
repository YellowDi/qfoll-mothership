<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-8">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center gap-4 text-sm">
          <span class="font-medium text-ink">{{ article.publishedAt }}</span>
          <span class="text-muted">{{ article.category || "最新动态" }}</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          {{ article.title }}
        </h1>
        <p class="mt-6 text-center text-base leading-[1.8] text-muted">
          {{ article.lead }}
        </p>
        <div v-if="article.primaryButtonText || article.secondaryButtonText" class="mt-5 flex items-center justify-center gap-1.5">
          <a
            v-if="article.primaryButtonText && article.primaryButtonUrl"
            class="inline-flex h-9 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85"
            :href="article.primaryButtonUrl"
            :target="linkTarget(article.primaryButtonUrl)"
            :rel="linkRel(article.primaryButtonUrl)"
          >
            {{ article.primaryButtonText }}
          </a>
          <a
            v-if="article.secondaryButtonText && article.secondaryButtonUrl"
            class="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-black/8 px-5 text-sm font-medium text-ink transition-colors hover:bg-black/12 dark:bg-white/14 dark:hover:bg-white/20"
            :href="article.secondaryButtonUrl"
            :target="linkTarget(article.secondaryButtonUrl)"
            :rel="linkRel(article.secondaryButtonUrl)"
          >
            {{ article.secondaryButtonText }}
            <i class="ri-arrow-right-s-fill text-sm"></i>
          </a>
        </div>
      </div>
      <div class="pt-20 w-full">
        <div class="mx-auto w-full max-w-[50%] max-md:max-w-full">
          <div class="flex w-full items-center justify-between gap-4 border-t border-line/12 pt-3 max-md:flex-wrap">
            <div class="article-speech-panel">
              <button
                class="article-speech-play-btn"
                type="button"
                :disabled="speechPrimaryDisabled"
                @click="handlePrimarySpeechAction"
                :aria-label="speechPrimaryLabel"
              >
                <i :class="speechPrimaryIcon" aria-hidden="true"></i>
              </button>
              <div class="article-speech-status">
                <div v-if="!isPlaying && !isPaused" class="article-speech-text article-speech-text--idle">
                  <span class="article-speech-label">朗读本文</span>
                  <span class="article-speech-separator">｜</span>
                  <span class="article-speech-meta">{{ formatClock(estimatedSeconds) }}</span>
                </div>
                <div v-else class="article-speech-text article-speech-text--active">
                  {{ formatClock(elapsedSeconds) }}
                </div>
              </div>
              <div
                v-if="isPlaying || isPaused"
                class="article-speech-rate"
                role="group"
                aria-label="朗读倍速"
              >
                <button
                  v-for="option in rateOptions"
                  :key="option"
                  class="article-speech-rate-btn"
                  type="button"
                  :class="{ 'is-active': option === rate }"
                  :disabled="speechRateDisabled"
                  @click="setRate(option)"
                >
                  {{ option }}x
                </button>
              </div>
            </div>
            <button
              class="relative inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-ink transition-colors hover:text-muted"
              type="button"
              @click="copyShareLink"
            >
              <i class="ri-share-line text-base"></i>
              分享
              <span
                v-if="copiedVisible"
                role="dialog"
                aria-live="polite"
                class="absolute left-1/2 top-full z-20 mt-2 inline-flex min-w-21 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl border border-line/10 bg-surface px-4 py-3 text-sm font-medium leading-none text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
              >
                已复制
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <article ref="articleContentRef" class="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-6 font-sans text-base leading-relaxed text-ink">
      <div
        class="markdown-body detail-markdown-body"
        v-html="article.bodyHtml"
        ref="markdownRef"
      ></div>
    </article>

    <DetailMetaCard
      :info-tag-links="infoTagLinks"
      :company="article.company"
      :info-panel-html="article.infoPanelHtml"
    />

    <RelatedContentSection
      title="继续阅读"
      view-all-to="/news"
      :items="relatedArticles"
      :item-to="articleRelatedTo"
      :primary-meta="articleRelatedPrimaryMeta"
      :secondary-meta="articleRelatedSecondaryMeta"
      item-class="max-md:w-[72%] max-md:basis-[72%]"
    />
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import DetailMetaCard from "../components/DetailMetaCard.vue";
import RelatedContentSection from "../components/RelatedContentSection.vue";
import { newsArticles, newsList } from "../data/news";
import { initInlineVideoPlayers } from "../composables/useInlineVideoPlayers";
import { useSpeechSynthesis } from "../composables/useSpeechSynthesis";
import "../styles/markdown-media.css";

const route = useRoute();
const article = computed(() => newsArticles[route.params.id] || newsList[0]);
const relatedArticles = computed(() => {
  const sameCategory = newsList.filter(
    (item) => item.id !== article.value.id && item.category === article.value.category
  );
  if (sameCategory.length >= 3) return sameCategory.slice(0, 3);
  const fallback = newsList.filter(
    (item) =>
      item.id !== article.value.id &&
      !sameCategory.some((picked) => picked.id === item.id)
  );
  return [...sameCategory, ...fallback].slice(0, 3);
});
const parseYearTag = (tag) => {
  const match = String(tag || "").trim().match(/^(\d{4})\s*年?$/);
  return match ? Number(match[1]) : null;
};
const resolveTagTarget = (tag) => {
  const text = String(tag || "").trim();
  if (!text) return { path: "/news" };
  const year = parseYearTag(text);
  if (year) {
    return { path: "/news", query: { years: String(year) } };
  }
  return { path: "/news", query: { tags: text } };
};
const infoTagLinks = computed(() =>
  (article.value.infoTags || []).map((tag) => ({
    label: tag,
    to: resolveTagTarget(tag),
  }))
);
const articleRelatedTo = (item) => `/news/${item.id}`;
const articleRelatedPrimaryMeta = (item) => item.tag;
const articleRelatedSecondaryMeta = (item) => item.publishedAt;

const markdownRef = ref(null);
const articleContentRef = ref(null);
const copiedVisible = ref(false);
let copiedTimer = null;
let alignTimer = null;
let disposeInlineVideoPlayers = null;
const rateOptions = [0.5, 1, 1.5, 2];

const {
  play,
  pause,
  resume,
  stop,
  isSupported,
  isPlaying,
  isPaused,
  rate,
  setRate,
  isVoicesReady,
  estimateDurationSeconds,
} = useSpeechSynthesis({
  containerRef: articleContentRef,
});
const elapsedSeconds = ref(0);
const estimatedSeconds = ref(0);
let elapsedTimer = null;
let elapsedStartAt = 0;
let elapsedBase = 0;

const speechPrimaryDisabled = computed(
  () => !isSupported.value || !isVoicesReady.value
);
const speechRateDisabled = computed(
  () => !isSupported.value || !isVoicesReady.value
);
const speechPrimaryLabel = computed(() => {
  if (!isSupported.value) return "当前浏览器不支持朗读";
  if (!isVoicesReady.value) return "正在加载语音";
  if (!isPlaying.value) return "开始朗读";
  return isPaused.value ? "继续朗读" : "暂停朗读";
});
const speechPrimaryIcon = computed(() => {
  if (!isPlaying.value) return "ri-play-fill";
  return isPaused.value ? "ri-play-fill" : "ri-pause-fill";
});
const handlePrimarySpeechAction = () => {
  if (!isSupported.value || !isVoicesReady.value) return;
  if (!isPlaying.value) {
    play();
    return;
  }
  if (isPaused.value) {
    resume();
    return;
  }
  pause();
};

const formatClock = (seconds) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const refreshEstimatedDuration = () => {
  estimatedSeconds.value = estimateDurationSeconds();
};

const stopElapsedTimer = () => {
  if (elapsedTimer) {
    window.clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
};

const startElapsedTimer = () => {
  stopElapsedTimer();
  elapsedStartAt = Date.now();
  elapsedTimer = window.setInterval(() => {
    elapsedSeconds.value = elapsedBase + Math.floor((Date.now() - elapsedStartAt) / 1000);
  }, 250);
};

const isExternalLink = (url) => /^https?:\/\//i.test(url || "");
const linkTarget = (url) => (isExternalLink(url) ? "_blank" : "_self");
const linkRel = (url) => (isExternalLink(url) ? "noreferrer" : undefined);

const copyShareLink = async () => {
  const text = window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    copiedVisible.value = true;
    if (copiedTimer) window.clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copiedVisible.value = false;
    }, 1400);
  } catch {
    copiedVisible.value = false;
  }
};

const handleMarkdownClick = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
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

const resolveTrackIndex = (track, cards, desiredCenter) => {
  const stored = getStoredTrackIndex(track, cards);
  if (stored !== null) return stored;
  // Before any interaction, always start from the first slide.
  setTrackIndex(track, 0, cards.length);
  return 0;
};

const getLandscapePeek = () => {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  if (viewportWidth <= 768) return 14;
  if (viewportWidth <= 1024) return 18;
  return 24;
};

const syncMarkdownCarouselWidths = () => {
  if (!markdownRef.value) return;
  const mediaNodes = markdownRef.value.querySelectorAll(".md-media");
  const peek = getLandscapePeek();
  mediaNodes.forEach((mediaNode) => {
    const mediaWidth = mediaNode.clientWidth;
    if (!mediaWidth) return;
    const landscapeWidth = Math.max(260, Math.min(1103, mediaWidth - peek * 2));
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

const scheduleAlign = () => {
  requestAnimationFrame(() => {
    alignMarkdownCarousels();
    if (alignTimer) window.clearTimeout(alignTimer);
    alignTimer = window.setTimeout(() => {
      alignMarkdownCarousels();
    }, 80);
  });
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
    const currentIndex = resolveTrackIndex(track, cards, desiredCenter);
    applyTrackEdgePadding(track, cards, desiredCenter);
    const targetCard = cards[currentIndex] || cards[0];
    if (!targetCard) return;
    const targetCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
    const nextScrollLeft = Math.max(0, targetCenter - desiredCenter);
    track.scrollTo({ left: nextScrollLeft });
  });
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
  }
  window.addEventListener("resize", alignMarkdownCarousels);
  window.addEventListener("orientationchange", scheduleAlign);
});

watch(
  () => route.params.id,
  async () => {
    stop();
    elapsedSeconds.value = 0;
    elapsedBase = 0;
    stopElapsedTimer();
    await nextTick();
    scheduleAlign();
    mountInlineVideoPlayers();
    refreshEstimatedDuration();
  }
);

watch(
  [isPlaying, isPaused],
  ([playing, paused]) => {
    if (playing && !paused) {
      startElapsedTimer();
      return;
    }
    if (playing && paused) {
      elapsedBase = elapsedSeconds.value;
      stopElapsedTimer();
      return;
    }
    if (!playing) {
      stopElapsedTimer();
      elapsedSeconds.value = 0;
      elapsedBase = 0;
    }
  },
  { immediate: true }
);

watch(rate, () => {
  refreshEstimatedDuration();
});

onUnmounted(() => {
  if (markdownRef.value) {
    markdownRef.value.removeEventListener("click", handleMarkdownClick, true);
    markdownRef.value.removeEventListener("load", handleImageLoaded, true);
  }
  window.removeEventListener("resize", alignMarkdownCarousels);
  window.removeEventListener("orientationchange", scheduleAlign);
  if (disposeInlineVideoPlayers) {
    disposeInlineVideoPlayers();
    disposeInlineVideoPlayers = null;
  }
  if (copiedTimer) window.clearTimeout(copiedTimer);
  if (alignTimer) window.clearTimeout(alignTimer);
  stopElapsedTimer();
});

onMounted(() => {
  refreshEstimatedDuration();
});
</script>

<style scoped>
.article-speech-panel {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
}

.article-speech-play-btn {
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  border: 0;
  background: rgb(var(--color-ink) / 0.08);
  color: rgb(var(--color-ink) / 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  position: relative;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.article-speech-play-btn > i {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  line-height: 1;
}

/* Optical centering: triangle play icon needs slight right shift vs geometric center. */
.article-speech-play-btn > i.ri-play-fill {
  transform: translate(-42%, -50%);
}

.article-speech-play-btn:hover:not(:disabled) {
  background: rgb(var(--color-ink) / 0.14);
}

.article-speech-play-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.article-speech-status {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.article-speech-text {
  font-size: 16px;
  color: rgb(var(--color-ink) / 1);
  letter-spacing: -0.01em;
}

.article-speech-text--idle {
  color: rgb(var(--color-ink) / 1);
}

.article-speech-label {
  color: rgb(var(--color-ink) / 1);
}

.article-speech-separator,
.article-speech-meta {
  color: rgb(var(--color-ink) / 0.56);
}

.article-speech-text--active {
  color: rgb(var(--color-ink) / 1);
}

.article-speech-rate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.article-speech-rate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-left: 1px solid rgb(var(--color-line) / 0.12);
  padding-left: 14px;
}

.article-speech-rate-btn {
  border: 0;
  background: transparent;
  color: rgb(var(--color-ink) / 0.4);
  padding: 0 4px;
  font-size: 14px;
  line-height: 1;
  transition: color 0.2s ease;
}

.article-speech-rate-btn.is-active {
  color: rgb(var(--color-ink) / 1);
  font-weight: 600;
}

@media (max-width: 768px) {
  .article-speech-panel {
    gap: 10px;
    flex-wrap: wrap;
  }

  .article-speech-rate {
    border-left: 0;
    padding-left: 0;
  }
}

</style>
