<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-8">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center gap-4 text-[13px]">
          <span class="font-medium text-ink">{{ project.year }}</span>
          <span class="text-muted">{{ project.company }}</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          {{ project.title }}
        </h1>
        <p class="mt-6 text-center text-base leading-[1.8] text-muted">
          {{ project.lead }}
        </p>
        <div v-if="project.primaryButtonText || project.secondaryButtonText" class="mt-5 flex items-center justify-center gap-1.5">
          <a
            v-if="project.primaryButtonText && project.primaryButtonUrl"
            class="inline-flex h-9 items-center justify-center rounded-full bg-black px-5 text-[13px] font-medium text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85"
            :href="project.primaryButtonUrl"
            :target="linkTarget(project.primaryButtonUrl)"
            :rel="linkRel(project.primaryButtonUrl)"
          >
            {{ project.primaryButtonText }}
          </a>
          <a
            v-if="project.secondaryButtonText && project.secondaryButtonUrl"
            class="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-black/8 px-5 text-[13px] font-medium text-ink transition-colors hover:bg-black/12 dark:bg-white/14 dark:hover:bg-white/20"
            :href="project.secondaryButtonUrl"
            :target="linkTarget(project.secondaryButtonUrl)"
            :rel="linkRel(project.secondaryButtonUrl)"
          >
            {{ project.secondaryButtonText }}
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
        v-html="project.bodyHtml"
        ref="markdownRef"
      ></div>
    </article>

    <div class="mx-auto w-full max-w-360 self-stretch bg-black/[0.045] py-10 dark:bg-white/[0.035]">
      <div class="mx-auto w-full max-w-[50%] px-14 max-lg:max-w-full max-lg:px-6 max-md:px-5">
        <div class="rounded-2xl bg-transparent py-8 max-md:px-6 max-md:py-6">
          <div class="flex flex-wrap gap-3">
            <span
            v-for="tag in project.infoTags"
            :key="tag"
            class="rounded-full border border-line/10 bg-surface px-4 py-2 text-xs font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            >{{ tag }}</span
          >
        </div>
        <div
          class="mt-6 text-sm leading-[1.8] text-muted"
          v-html="project.infoPanelHtml"
        ></div>
        </div>
      </div>
    </div>

    <div class="w-full max-w-360 self-stretch mx-auto mt-10 overflow-x-hidden max-md:max-w-none max-md:w-screen max-md:ml-[calc(50%-50vw)] max-md:mr-[calc(50%-50vw)]">
      <div class="mx-auto flex w-full items-center justify-between px-16 max-xl:px-6 max-md:px-5">
        <h3 class="text-lg font-medium">更多项目</h3>
        <RouterLink class="text-[13px] text-muted transition-colors hover:text-ink" to="/projects">查看全部</RouterLink>
      </div>
      <div class="mx-auto w-full px-16 pb-20 pt-6 max-xl:px-6 max-md:pl-5 max-md:pr-0">
        <div class="no-scrollbar grid grid-cols-3 gap-6 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:overflow-x-auto max-md:pb-4 max-md:pr-6 max-md:scroll-pl-5 max-md:scroll-pr-6 max-md:-ml-5 max-md:pl-5">
      <RouterLink
        v-for="item in relatedProjects"
        :key="item.id"
        class="group overflow-hidden rounded-md max-md:snap-start max-md:min-w-[72%] max-md:flex-shrink-0"
        :to="`/project/${item.id}`"
      >
        <div class="aspect-square w-full overflow-hidden rounded-md">
          <div class="h-full w-full rounded-md bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]" :style="{ backgroundImage: item.cover }"></div>
        </div>
        <div class="pt-4 text-left">
          <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
          <div class="mt-4 flex items-center gap-2 text-sm">
            <span class="font-medium text-ink">{{ item.tag }}</span>
            <span class="text-muted">{{ item.year }}</span>
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
import { projects, projectList } from "../data/projects";
import { initInlineVideoPlayers } from "../composables/useInlineVideoPlayers";

const route = useRoute();
const project = computed(() => projects[route.params.id] || projects.hzhst);
const relatedProjects = computed(() =>
  projectList.filter((item) => item.id !== project.value.id).slice(0, 3)
);

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

const scrollCarouselToIndex = (track, cards, index) => {
  if (!cards.length) return;
  const cardWidth = cards[0].offsetWidth;
  const desiredCenter = getDesiredCenter(track);
  const padding = Math.max(0, desiredCenter - cardWidth / 2);
  track.style.paddingLeft = `${padding}px`;
  track.style.paddingRight = `${padding}px`;
  const targetCard = cards[index];
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

const getCurrentIndex = (track, cards) => {
  const desiredCenter = getDesiredCenter(track);
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
  const textBlock = markdownRef.value.querySelector(
    ".markdown-body > *:not(.md-media)"
  );
  const textRect = textBlock?.getBoundingClientRect();
  const tracks = markdownRef.value.querySelectorAll(
    ".md-carousel-track[data-carousel-track='true']"
  );
  tracks.forEach((track) => {
    const first = track.querySelector(".md-carousel-card");
    if (!first) return;
    const cardWidth = first.offsetWidth;
    const trackRect = track.getBoundingClientRect();
    let desiredCenter = track.clientWidth / 2;
    if (textRect) {
      desiredCenter = textRect.left + textRect.width / 2 - trackRect.left;
    }
    const padding = Math.max(0, desiredCenter - cardWidth / 2);
    track.style.paddingLeft = `${padding}px`;
    track.style.paddingRight = `${padding}px`;
    const firstCenter = first.offsetLeft + cardWidth / 2;
    const nextScrollLeft = Math.max(0, firstCenter - desiredCenter);
    track.scrollTo({ left: nextScrollLeft });
  });
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
