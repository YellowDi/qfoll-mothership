<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-8">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center gap-4 text-[13px]">
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
            class="inline-flex h-9 items-center justify-center rounded-full bg-black px-5 text-[13px] font-medium text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85"
            :href="article.primaryButtonUrl"
            :target="linkTarget(article.primaryButtonUrl)"
            :rel="linkRel(article.primaryButtonUrl)"
          >
            {{ article.primaryButtonText }}
          </a>
          <a
            v-if="article.secondaryButtonText && article.secondaryButtonUrl"
            class="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-black/8 px-5 text-[13px] font-medium text-ink transition-colors hover:bg-black/12 dark:bg-white/14 dark:hover:bg-white/20"
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
          <div class="flex w-full items-center justify-end border-t border-line/12 pt-3">
            <button
              class="relative inline-flex items-center gap-2 rounded-full px-2 py-1 text-[13px] text-ink transition-colors hover:text-muted"
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

    <article class="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-6 font-sans text-base leading-relaxed text-ink">
      <div
        class="markdown-body"
        v-html="article.bodyHtml"
        ref="markdownRef"
      ></div>
    </article>

    <div class="news-meta-section w-full max-w-360 self-stretch mx-auto py-10">
      <div class="mx-auto w-full px-16 max-xl:px-6 max-md:px-5">
        <div class="news-meta-card bg-black/[0.045] px-3 py-6 md:py-10 grid grid-cols-12 rounded-md dark:bg-white/[0.06]">
          <div class="col-span-12 flex flex-col gap-6 md:col-span-6 md:col-start-4">
            <section class="w-full">
              <ul class="news-meta-tags gap-3xs flex flex-wrap">
                <li v-for="tag in article.infoTags" :key="tag">
                  <span class="news-meta-pill">{{ tag }}</span>
                </li>
              </ul>
            </section>
          <div v-if="article.company" class="news-meta-company text-sm leading-[1.8] text-ink">
            {{ article.company }}
          </div>
          <div
            v-if="article.infoPanelHtml"
            class="news-info-panel-content info-panel-content text-sm leading-[1.8] text-muted"
            v-html="article.infoPanelHtml"
          ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full max-w-360 self-stretch mx-auto mt-10 overflow-x-hidden max-md:max-w-none max-md:w-screen max-md:ml-[calc(50%-50vw)] max-md:mr-[calc(50%-50vw)]">
      <div class="mx-auto flex w-full items-center justify-between px-16 max-xl:px-6 max-md:px-5">
        <h3 class="text-lg font-medium">继续阅读</h3>
        <RouterLink class="text-[13px] text-muted transition-colors hover:text-ink" to="/news">查看全部</RouterLink>
      </div>
      <div class="mx-auto w-full px-16 pb-20 pt-6 max-xl:px-6 max-md:pl-5 max-md:pr-0">
        <div class="no-scrollbar grid grid-cols-3 gap-6 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:overflow-x-auto max-md:pb-4 max-md:pr-6 max-md:scroll-pl-5 max-md:scroll-pr-6 max-md:-ml-5 max-md:pl-5">
      <RouterLink
        v-for="item in relatedArticles"
        :key="item.id"
        class="group overflow-hidden rounded-md max-md:snap-start max-md:min-w-[72%] max-md:w-[72%] max-md:basis-[72%] max-md:flex-shrink-0"
        :to="`/news/${item.id}`"
      >
        <div class="aspect-square w-full overflow-hidden rounded-md">
          <div class="h-full w-full rounded-md bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]" :style="{ backgroundImage: item.cover }"></div>
        </div>
        <div class="pt-4 text-left">
          <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
          <div class="mt-4 flex items-center gap-2 text-sm">
            <span class="font-medium text-ink">{{ item.tag }}</span>
            <span class="text-muted">{{ item.publishedAt }}</span>
          </div>
        </div>
      </RouterLink>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import { newsArticles, newsList } from "../data/news";
import { initInlineVideoPlayers } from "../composables/useInlineVideoPlayers";

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

const markdownRef = ref(null);
const copiedVisible = ref(false);
let copiedTimer = null;
let alignTimer = null;
let disposeInlineVideoPlayers = null;

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
    await nextTick();
    scheduleAlign();
    mountInlineVideoPlayers();
  }
);

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
});
</script>
