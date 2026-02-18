<template>
  <section :class="sectionClass">
    <div
      class="relative overflow-hidden border border-line/10 bg-bg/95 select-none dark:bg-zinc-900/90 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      :class="[
        props.homePreview ? 'rounded-md p-8 max-md:p-5' : 'rounded-2xl px-8 pt-8 pb-0 max-md:px-5 max-md:pt-5 max-md:pb-0',
      ]"
    >
      <YgbRoadMapBg class="pointer-events-none absolute inset-0 opacity-[0.96]" />
      <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(246,245,244,0.08),rgba(246,245,244,0.02)_40%,rgba(246,245,244,0.08)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)_40%,rgba(255,255,255,0.03)_100%)]"></div>
      <div class="pointer-events-none absolute inset-0 [mask-image:radial-gradient(88%_80%_at_15%_12%,#000_0%,rgba(0,0,0,0.92)_34%,rgba(0,0,0,0.56)_58%,rgba(0,0,0,0.2)_74%,transparent_92%)] bg-[radial-gradient(112%_92%_at_14%_8%,rgba(246,245,244,0.88)_0%,rgba(246,245,244,0.62)_34%,rgba(246,245,244,0.24)_62%,rgba(246,245,244,0)_90%)] dark:bg-[radial-gradient(112%_92%_at_14%_8%,rgba(18,18,22,0.92)_0%,rgba(18,18,22,0.72)_34%,rgba(18,18,22,0.34)_62%,rgba(18,18,22,0)_90%)]"></div>

      <div class="relative grid w-full min-w-0 max-w-full grid-cols-1 gap-8 xl:grid-cols-2 xl:items-end">
        <div :class="homePreview ? 'w-full min-w-0 max-w-full' : 'w-full min-w-0 max-w-full xl:self-start'">
          <div
            class="inline-flex max-w-full items-center gap-2 rounded-full border border-line/10 bg-surface/90 px-3 py-1 text-sm text-muted"
          >
            <i class="ri-shining-line text-sm"></i>
            智能化车货匹配 · 全球货运定位 · 实时推荐预警
          </div>
          <p class="mt-5 text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-orange-400">
            云柜宝
          </p>
          <h1 class="mt-1 whitespace-nowrap text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-ink">
            智能集卡物流平台
          </h1>
          <p class="mt-3 text-[clamp(1.15rem,1.9vw,1.8rem)] leading-tight font-medium text-ink">
            让运输管理更简单、更高效
          </p>
          <div class="relative mt-1 flex w-full min-w-0 max-w-full flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap text-[clamp(1.15rem,1.9vw,1.8rem)] leading-tight font-medium text-ink max-md:text-[clamp(1rem,4.4vw,1.18rem)]">
            <span class="shrink-0">物流运输管理再也不会</span>
            <span
              class="inline-flex min-w-0 items-center bg-[linear-gradient(90deg,#ff6f5f,#fe8348,#8f48ff)] bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(143,72,255,0.15)] md:min-w-[5.8em]"
            >
              {{ typedPain }}
              <span class="ml-1 inline-block h-[1.05em] w-[2px] animate-pulse rounded-full bg-violet-500/85"></span>
            </span>
          </div>
          <p class="mt-4 w-full min-w-0 max-w-full pr-2 whitespace-normal break-all text-sm leading-relaxed text-muted md:pr-0 md:break-words xl:max-w-136">
            云柜宝立足国际物流运输场景，融合物流网络与大数据技术，围绕车货匹配、在途监管、时间节点记录和异常预警，构建一体化运输管理能力。
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-3">
            <RouterLink
              v-if="preview"
              to="/ygb"
              class="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85"
            >
              了解更多
              <i class="ri-arrow-right-line text-base"></i>
            </RouterLink>
            <template v-else>
              <button
                type="button"
                class="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85"
                @click="scrollToDownloadSection"
              >
                下载 App
                <i class="ri-download-2-line text-base"></i>
              </button>
              <a
                href="https://www.ygbonline.com/admin/#/login"
                target="_blank"
                rel="noreferrer"
                class="inline-flex h-10 items-center gap-2 rounded-full border border-line/10 bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-black/4 dark:hover:bg-white/8"
              >
                管理后台
                <i class="ri-arrow-right-line text-base"></i>
              </a>
            </template>
          </div>
        </div>

        <div v-if="!homePreview" class="w-full min-w-0 xl:self-end">
          <div
            ref="heroStackRef"
            class="relative h-[26.5rem] w-full min-w-0 md:h-[34rem]"
            @mouseenter="pauseHeroAutoPlay"
            @mouseleave="resumeHeroAutoPlay"
          >
            <article
              v-for="(card, idx) in heroCards"
              :key="card.title"
              class="absolute left-0 right-0 top-0 mx-auto w-full overflow-hidden rounded-t-2xl rounded-b-none border border-line/10 bg-surface shadow-[0_18px_50px_rgba(17,17,17,0.12)] transition-all duration-300 ease-out md:left-auto md:right-0 md:mx-0 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
              :class="[heroCardClass(idx), heroCardIndex !== idx ? 'h-[2.9rem] md:h-[3.1rem]' : '']"
              @click="setHeroCardWithReset(idx)"
            >
              <div class="flex items-center justify-between border-b border-line/10 bg-black/3 px-4 py-2 dark:bg-white/6">
                <div class="text-sm font-medium text-ink">{{ card.badge }}</div>
                <i class="ri-arrow-right-up-line text-sm text-muted"></i>
              </div>
              <div class="px-4 pt-3 pb-2">
                <h3 class="text-lg leading-[1.28] font-medium text-ink max-md:text-[17px]">{{ card.title }}</h3>
                <p class="mt-1 text-sm leading-[1.7] text-muted">
                  {{ card.desc }}
                </p>
              </div>
              <div class="px-4 pb-4">
                <div class="overflow-hidden rounded-lg border border-line/10 bg-black/3 dark:bg-white/5">
                  <img
                    :src="card.image"
                    :srcset="card.imageSrcSet"
                    :sizes="heroCardImageSizes"
                    :alt="card.title"
                    class="block h-auto w-full"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </article>
            <div class="absolute bottom-3 left-1/2 z-70 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line/10 bg-surface/95 px-2 py-1 shadow-[0_4px_16px_rgba(17,17,17,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-muted transition-colors hover:text-ink"
                @click.stop="shiftHeroWithReset(-1)"
                aria-label="上一张"
              >
                <i class="ri-arrow-left-line"></i>
              </button>
              <div class="flex items-center gap-1">
                <button
                  v-for="(dotCard, dotIdx) in heroCards"
                  :key="`hero-dot-${dotCard.title}`"
                  type="button"
                  class="h-1.5 rounded-full transition-all"
                  :class="heroCardIndex === dotIdx ? 'w-5 bg-ink/85' : 'w-2 bg-ink/24 hover:bg-ink/35'"
                  @click.stop="setHeroCardWithReset(dotIdx)"
                  :aria-label="`切换到第 ${dotIdx + 1} 张`"
                ></button>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-base text-muted transition-colors hover:text-ink"
                @click.stop="shiftHeroWithReset(1)"
                aria-label="下一张"
              >
                <i class="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import YgbRoadMapBg from "./YgbRoadMapBg.vue";
import hero01Image from "../assets/ygb-assets/hero-01.webp";
import hero02Image from "../assets/ygb-assets/hero-02.webp";
import hero03Image from "../assets/ygb-assets/hero-03.webp";
import hero01ImageSrcSet from "../assets/ygb-assets/hero-01.webp?w=480;640;800;960;1200&format=webp&as=srcset";
import hero02ImageSrcSet from "../assets/ygb-assets/hero-02.webp?w=480;640;800;960;1200&format=webp&as=srcset";
import hero03ImageSrcSet from "../assets/ygb-assets/hero-03.webp?w=480;640;800;960;1200&format=webp&as=srcset";

const props = defineProps({
  preview: {
    type: Boolean,
    default: false,
  },
  homePreview: {
    type: Boolean,
    default: false,
  },
});

const sectionClass = computed(() =>
  props.homePreview ? "w-full" : "mx-auto w-full max-w-360 px-14 max-lg:px-6 max-md:px-5",
);
const heroCardImageSizes = "(max-width: 768px) 88vw, (max-width: 1280px) 52vw, 46vw";

const heroCards = [
  {
    badge: "全流程可视化管理",
    title: "智能系统追踪，实时掌控业务状态",
    desc: "实时、精准的车辆 GPS 定位，确保运输透明可控。用户可查询货物流转，系统自动记录关键节点，实时定位车辆，并智能校正数据，提升运营效率。",
    image: hero01Image,
    imageSrcSet: hero01ImageSrcSet,
  },
  {
    badge: "数据驱动智能调度",
    title: "智能调度，高效匹配",
    desc: "云柜宝小程序通过强大的数据分析能力，结合集卡车辆定位信息，实现科学的车货匹配，优化运输路径，从而有效降低空载率，提高运输效率。",
    image: hero02Image,
    imageSrcSet: hero02ImageSrcSet,
  },
  {
    badge: "运输安全与责任保障体系",
    title: "全链路物流保障，构建更完善的物流生态",
    desc: "云柜宝不仅专注于运输环节的优化，同时提供港口与堆场的协同延伸服务和提供全程物流责任险，最大限度保障货物安全，为客户提供更加安心的服务体验。",
    image: hero03Image,
    imageSrcSet: hero03ImageSrcSet,
  },
];

const heroCardIndex = ref(0);
const HERO_AUTO_PLAY_INTERVAL_MS = 4200;
const HERO_AUTO_PLAY_START_DELAY_MS = 360;
const heroStackRef = ref(null);
const isHeroHovered = ref(false);
const isHeroInView = ref(false);
const prefersReducedMotion = ref(false);
const painTags = [
  "效率低下",
  "路线混乱",
  "信息滞后",
  "推进缓慢",
  "对接低效",
  "延误频繁",
];
const typedPain = ref(painTags[0]);
const painIndex = ref(0);
let painTimer = 0;
let heroAutoPlayTimer = 0;
let heroAutoPlayDelayTimer = 0;
let heroVisibilityObserver = null;
let charIndex = painTags[0].length;
let deleting = false;

const shiftHero = (step) => {
  const total = heroCards.length;
  heroCardIndex.value = (heroCardIndex.value + step + total) % total;
};

const clearHeroAutoPlay = () => {
  if (!heroAutoPlayTimer) return;
  window.clearInterval(heroAutoPlayTimer);
  heroAutoPlayTimer = 0;
};

const clearHeroAutoPlayDelay = () => {
  if (!heroAutoPlayDelayTimer) return;
  window.clearTimeout(heroAutoPlayDelayTimer);
  heroAutoPlayDelayTimer = 0;
};

const shouldRunHeroAutoPlay = () =>
  !props.homePreview &&
  !isHeroHovered.value &&
  isHeroInView.value &&
  !document.hidden &&
  !prefersReducedMotion.value;

const startHeroAutoPlay = ({ immediate = false } = {}) => {
  clearHeroAutoPlay();
  clearHeroAutoPlayDelay();
  if (!shouldRunHeroAutoPlay()) return;
  const startInterval = () => {
    heroAutoPlayTimer = window.setInterval(() => {
      shiftHero(1);
    }, HERO_AUTO_PLAY_INTERVAL_MS);
  };
  if (immediate) {
    startInterval();
    return;
  }
  heroAutoPlayDelayTimer = window.setTimeout(() => {
    heroAutoPlayDelayTimer = 0;
    if (!shouldRunHeroAutoPlay()) return;
    startInterval();
  }, HERO_AUTO_PLAY_START_DELAY_MS);
};

const syncHeroAutoPlay = () => {
  if (shouldRunHeroAutoPlay()) {
    startHeroAutoPlay();
    return;
  }
  clearHeroAutoPlayDelay();
  clearHeroAutoPlay();
};

const pauseHeroAutoPlay = () => {
  isHeroHovered.value = true;
  syncHeroAutoPlay();
};

const resumeHeroAutoPlay = () => {
  isHeroHovered.value = false;
  syncHeroAutoPlay();
};

const setHeroCardWithReset = (index) => {
  heroCardIndex.value = index;
  startHeroAutoPlay({ immediate: true });
};

const shiftHeroWithReset = (step) => {
  shiftHero(step);
  startHeroAutoPlay({ immediate: true });
};

const scrollToDownloadSection = () => {
  const section = document.getElementById("download");
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
};

const onDocumentVisibilityChange = () => {
  syncHeroAutoPlay();
};

const heroCardClass = (index) => {
  const total = heroCards.length;
  const order = (index - heroCardIndex.value + total) % total;
  if (order === 0) {
    return "z-30 opacity-100 translate-y-[6.1rem] scale-100 md:translate-y-[7.8rem]";
  }
  if (order === 1) {
    return "z-20 opacity-95 translate-y-[4.2rem] scale-[0.86] md:translate-y-[5.25rem] md:scale-[0.88]";
  }
  return "z-10 opacity-85 translate-y-[2.45rem] scale-[0.74] md:translate-y-[3.1rem] md:scale-[0.76]";
};

const tickPain = () => {
  const current = painTags[painIndex.value];
  if (!deleting) {
    if (charIndex < current.length) {
      charIndex += 1;
      typedPain.value = current.slice(0, charIndex);
      painTimer = window.setTimeout(tickPain, 95);
      return;
    }
    deleting = true;
    painTimer = window.setTimeout(tickPain, 1100);
    return;
  }

  if (charIndex > 0) {
    charIndex -= 1;
    typedPain.value = current.slice(0, charIndex);
    painTimer = window.setTimeout(tickPain, 58);
    return;
  }

  deleting = false;
  painIndex.value = (painIndex.value + 1) % painTags.length;
  charIndex = 0;
  painTimer = window.setTimeout(tickPain, 180);
};

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("visibilitychange", onDocumentVisibilityChange);
  if (!props.homePreview) {
    if ("IntersectionObserver" in window && heroStackRef.value) {
      heroVisibilityObserver = new IntersectionObserver(
        ([entry]) => {
          isHeroInView.value = Boolean(entry?.isIntersecting);
          syncHeroAutoPlay();
        },
        { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
      );
      heroVisibilityObserver.observe(heroStackRef.value);
    } else {
      isHeroInView.value = true;
    }
  }
  syncHeroAutoPlay();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    typedPain.value = painTags[0];
    return;
  }
  charIndex = painTags[0].length;
  typedPain.value = painTags[0];
  deleting = true;
  painTimer = window.setTimeout(tickPain, 1100);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", onDocumentVisibilityChange);
  if (heroVisibilityObserver) {
    heroVisibilityObserver.disconnect();
    heroVisibilityObserver = null;
  }
  clearHeroAutoPlayDelay();
  clearHeroAutoPlay();
  if (painTimer) window.clearTimeout(painTimer);
});

</script>
