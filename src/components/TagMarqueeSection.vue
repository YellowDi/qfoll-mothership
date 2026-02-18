<template>
  <section
    ref="sectionRef"
    class="tilt-wall-section relative mt-14 w-auto overflow-hidden -mx-14 max-lg:-mx-6 max-md:-mx-5 max-md:mt-10"
  >
    <div class="relative w-full pb-16 max-md:pb-11">
      <div
        class="tilt-wall"
        :class="{ 'tilt-wall--dark': isDark, 'tilt-wall--paused': !isAnimationActive, 'tilt-wall--lite': performanceMode === 'lite' }"
      >
        <div class="tilt-wall__scene">
          <div class="tilt-wall__text-layer">
            <div
              v-for="stripe in stripes"
              :key="stripe.key"
              class="tilt-wall__stripe"
              :style="{ '--stripe-index': stripe.index }"
            >
              <div
                class="tilt-wall__track"
                :class="{ 'tilt-wall__track--compact': isCompactTrackMode }"
                :style="{ '--tilt-duration': stripe.duration, '--tilt-direction': stripe.direction, '--tilt-delay': stripe.delay }"
              >
                <template v-if="isCompactTrackMode">
                  <span class="tilt-wall__word-line">{{ stripe.compactLine }}</span>
                  <span class="tilt-wall__word-line">{{ stripe.compactLine }}</span>
                </template>
                <template v-else>
                  <span
                    v-for="(word, idx) in stripe.words"
                    :key="`${stripe.key}-a-${idx}`"
                    class="tilt-wall__word"
                  >
                    {{ word }}
                  </span>
                  <span
                    v-for="(word, idx) in stripe.words"
                    :key="`${stripe.key}-b-${idx}`"
                    class="tilt-wall__word"
                  >
                    {{ word }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div class="tilt-wall__grain"></div>
          <div v-if="isDark" class="tilt-wall__vignette"></div>
        </div>
        <div class="tilt-wall__edge-blend"></div>

        <div class="tilt-wall__content">
          <div class="tilt-wall__content-inner">
            <div class="tilt-wall__headline mx-auto w-full max-w-245 text-left">
              <p class="tilt-wall__title-muted tilt-wall__title-line text-[44px] font-medium leading-[1.18]">
                每个专业领域都各有特色，
              </p>
              <p class="tilt-wall__title-main tilt-wall__title-line mt-3 text-[44px] font-medium leading-[1.18]">
                您的想法，我们心领神会
              </p>
            </div>

            <div class="mx-auto mt-10 w-full max-w-245 text-left max-md:mt-7">
              <p class="tilt-wall__body text-lg leading-[1.88] max-md:text-base">
                以智能化与标准化为底座，
                我们为企业构建更高效、更低成本的数字运营体系。<br />
                聚焦
                <span class="tilt-wall__body-strong font-medium">
                  数智水利 · 智慧交通 · 网络货运 · 在线教育与商城独立站
                </span>
                四大方向，持续输出可落地的数字化能力。
              </p>

              <RouterLink
                to="/contact"
                class="pointer-events-auto mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-on-dark transition-colors hover:bg-black/85 dark:bg-white dark:text-primary dark:hover:bg-white/85 max-md:mt-6"
              >
                联系我们
                <i class="ri-arrow-right-line text-base"></i>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useTheme } from "../composables/useTheme";

const { isDark } = useTheme();
const sectionRef = ref(null);
const isSectionInView = ref(true);
const viewportTier = ref("desktop");
const isDocumentVisible = ref(true);
const performanceMode = ref("full");
const isAnimationActive = computed(() => isSectionInView.value && isDocumentVisible.value);
const isCompactTrackMode = computed(
  () => viewportTier.value === "mobile" || viewportTier.value === "phone" || performanceMode.value === "lite",
);
const shouldProbePerformance = computed(() => viewportTier.value === "desktop" || viewportTier.value === "tablet");

let sectionObserver;
let mediaCleanup = [];
let visibilityHandler;
let probeRaf = null;
let probeTimer = null;
let probeObserver = null;
const probeState = {
  started: false,
  done: false,
  frameCount: 0,
  startAt: 0,
  longTaskCount: 0,
  longTaskDuration: 0,
};

const stopPerformanceProbe = (resetState = false) => {
  if (probeRaf) {
    cancelAnimationFrame(probeRaf);
    probeRaf = null;
  }
  if (probeTimer) {
    clearTimeout(probeTimer);
    probeTimer = null;
  }
  probeObserver?.disconnect();
  probeObserver = null;
  if (resetState) {
    probeState.started = false;
    probeState.done = false;
    probeState.frameCount = 0;
    probeState.startAt = 0;
    probeState.longTaskCount = 0;
    probeState.longTaskDuration = 0;
  }
};

const finalizePerformanceProbe = () => {
  if (!probeState.started || probeState.done) return;
  probeState.done = true;
  const elapsedMs = Math.max(1, performance.now() - probeState.startAt);
  const fps = (probeState.frameCount / elapsedMs) * 1000;
  const shouldDowngrade =
    (fps < 52 && probeState.frameCount > 30) ||
    probeState.longTaskCount >= 2 ||
    probeState.longTaskDuration >= 120;
  if (shouldDowngrade) {
    performanceMode.value = "lite";
  }
  stopPerformanceProbe();
};

const performanceProbeTick = (ts) => {
  if (!probeState.startAt) {
    probeState.startAt = ts;
  }
  probeState.frameCount += 1;
  probeRaf = requestAnimationFrame(performanceProbeTick);
};

const startPerformanceProbe = () => {
  if (typeof window === "undefined") return;
  if (probeState.started || performanceMode.value === "lite") return;
  if (!shouldProbePerformance.value || !isSectionInView.value || document.hidden) return;

  probeState.started = true;
  probeState.done = false;
  probeState.frameCount = 0;
  probeState.startAt = 0;
  probeState.longTaskCount = 0;
  probeState.longTaskDuration = 0;

  if ("PerformanceObserver" in window) {
    try {
      probeObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType !== "longtask") continue;
          probeState.longTaskCount += 1;
          probeState.longTaskDuration += entry.duration;
        }
      });
      probeObserver.observe({ entryTypes: ["longtask"] });
    } catch {
      probeObserver = null;
    }
  }

  probeRaf = requestAnimationFrame(performanceProbeTick);
  probeTimer = window.setTimeout(finalizePerformanceProbe, 4500);
};

onMounted(() => {
  if (typeof window === "undefined") return;

  const mqPhone = window.matchMedia("(max-width: 430px)");
  const mqMobile = window.matchMedia("(max-width: 768px)");
  const mqTablet = window.matchMedia("(max-width: 1280px)");

  const syncViewportTier = () => {
    if (mqPhone.matches) {
      viewportTier.value = "phone";
      return;
    }
    if (mqMobile.matches) {
      viewportTier.value = "mobile";
      return;
    }
    if (mqTablet.matches) {
      viewportTier.value = "tablet";
      return;
    }
    viewportTier.value = "desktop";
  };

  const onMediaChange = () => {
    syncViewportTier();
    startPerformanceProbe();
  };

  [mqPhone, mqMobile, mqTablet].forEach((mq) => {
    mq.addEventListener("change", onMediaChange);
    mediaCleanup.push(() => mq.removeEventListener("change", onMediaChange));
  });
  syncViewportTier();
  isDocumentVisible.value = !document.hidden;

  visibilityHandler = () => {
    isDocumentVisible.value = !document.hidden;
    if (isDocumentVisible.value) {
      startPerformanceProbe();
    } else {
      stopPerformanceProbe(true);
    }
  };
  document.addEventListener("visibilitychange", visibilityHandler);

  if ("IntersectionObserver" in window && sectionRef.value) {
    sectionObserver = new IntersectionObserver(
      ([entry]) => {
        isSectionInView.value = Boolean(entry?.isIntersecting);
        if (entry?.isIntersecting) {
          startPerformanceProbe();
        }
      },
      {
        threshold: 0.01,
        rootMargin: "120px 0px 120px 0px",
      },
    );

    sectionObserver.observe(sectionRef.value);
  }

  startPerformanceProbe();
});

onBeforeUnmount(() => {
  stopPerformanceProbe();
  sectionObserver?.disconnect();
  sectionObserver = undefined;
  mediaCleanup.forEach((cleanup) => cleanup());
  mediaCleanup = [];
  if (typeof document !== "undefined" && visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
  }
  visibilityHandler = undefined;
});

const baseWords = [
  "远程监控",
  "SaaS",
  "货运管理",
  "水站监控",
  "数据大屏",
  "产品目录",
  "在线表单",
  "设备巡检",
  "在线教育",
  "品牌升级",
  "仓管系统",
  "在线商城",
  "车辆轨迹",
  "票务核销",
  "场景模板",
  "会员体系",
  "大数据分析",
  "微信小程序",
  "兑换核销",
  "在线视频",
  "企业管理",
  "设计框架",
  "流程引擎",
  "可视化报表",
];
const compactBaseWords = baseWords.filter((_, idx) => idx % 2 === 0);

const stripeConfigs = [
  { key: "s1", index: 0, duration: "540s", direction: "normal" },
  { key: "s2", index: 1, duration: "620s", direction: "reverse" },
  { key: "s3", index: 2, duration: "580s", direction: "normal" },
  { key: "s4", index: 3, duration: "660s", direction: "reverse" },
  { key: "s5", index: 4, duration: "520s", direction: "normal" },
  { key: "s6", index: 5, duration: "700s", direction: "reverse" },
];

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = (items, seed) => {
  const next = [...items];
  const rand = mulberry32(seed);
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const buildStripeWords = (stripeIndex, sourceWords = baseWords) => {
  const shuffled = shuffleWithSeed(sourceWords, 20260213 + stripeIndex * 97);
  const offset = (stripeIndex * 3) % shuffled.length;
  const rotated = [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
  return stripeIndex % 2 === 0 ? rotated : [...rotated].reverse();
};

const allStripes = stripeConfigs.map((stripe, stripeIndex) => {
  const durationSeconds = Number.parseFloat(stripe.duration) || 1;
  const phaseRand = mulberry32(8800 + stripeIndex * 71)();
  const compactWords = buildStripeWords(stripeIndex, compactBaseWords);
  return {
    ...stripe,
    words: buildStripeWords(stripeIndex),
    compactLine: compactWords.join("   "),
    delay: `-${(durationSeconds * phaseRand).toFixed(1)}s`,
  };
});

const visibleStripeCount = computed(() => {
  if (viewportTier.value === "phone") return 5;
  if (viewportTier.value === "mobile") return 6;
  if (viewportTier.value === "tablet") return 5;
  return allStripes.length;
});

const stripes = computed(() => allStripes.slice(0, visibleStripeCount.value));
</script>

<style scoped>
.tilt-wall-section {
  content-visibility: visible;
}

.tilt-wall {
  --tilt-angle: 0deg;
  --wall-height: 46rem;
  --scene-width: 100%;
  --scene-height: 100%;
  --stripe-left: -70%;
  --stripe-width: 240%;
  --stripe-gap: 2.2rem;
  --word-size: clamp(7.8rem, 9.1vw, 9.8rem);
  --stripe-start: 2%;
  --stripe-step: 19%;
  --wall-glow: rgba(255, 255, 255, 0);
  --wall-bg-start: #ffffff;
  --wall-bg-mid: #ffffff;
  --wall-bg-end: #ffffff;
  --grain-dot: rgba(20, 28, 40, 0.42);
  --grain-opacity: 0.006;
  --vignette-center: rgba(255, 255, 255, 0);
  --vignette-edge: rgba(255, 255, 255, 0);
  --vignette-side: rgba(255, 255, 255, 0);
  --vignette-top: rgba(255, 255, 255, 0);
  --vignette-bottom: rgba(255, 255, 255, 0);
  --word-color: rgba(42, 54, 72, 0.2);
  --word-opacity: 0.18;
  --word-shadow: none;
  --word-hover-color: rgba(58, 72, 92, 0.32);
  --word-hover-opacity: 0.3;
  --word-hover-shadow: 0 0 3px rgba(120, 136, 160, 0.1);
  --title-muted-color: rgba(17, 24, 39, 0.4);
  --title-main-color: rgba(16, 23, 35, 0.95);
  --body-color: rgba(31, 41, 55, 0.72);
  --body-strong-color: rgba(10, 14, 20, 0.94);
  --edge-blend-color: rgba(255, 255, 255, 0.98);
  --edge-blend-top: 0%;
  --edge-blend-x: 12%;
  --edge-blend-y: 15%;
  position: relative;
  height: var(--wall-height);
  overflow: hidden;
  contain: layout paint;
  background:
    radial-gradient(72% 62% at 52% 44%, var(--wall-glow), rgba(255, 255, 255, 0) 58%),
    linear-gradient(155deg, var(--wall-bg-start) 0%, var(--wall-bg-mid) 44%, var(--wall-bg-end) 100%);
}

.tilt-wall.tilt-wall--dark {
  --wall-glow: rgba(255, 255, 255, 0);
  --wall-bg-start: rgb(var(--color-bg) / 1);
  --wall-bg-mid: rgb(var(--color-bg) / 1);
  --wall-bg-end: rgb(var(--color-bg) / 1);
  --grain-dot: rgba(255, 255, 255, 0.58);
  --grain-opacity: 0.007;
  --vignette-center: rgba(0, 0, 0, 0);
  --vignette-edge: rgba(0, 0, 0, 0);
  --vignette-side: rgba(0, 0, 0, 0);
  --vignette-top: rgba(0, 0, 0, 0);
  --vignette-bottom: rgba(0, 0, 0, 0);
  --word-color: rgba(255, 255, 255, 0.16);
  --word-opacity: 0.1;
  --word-shadow: none;
  --word-hover-color: rgba(236, 242, 252, 0.52);
  --word-hover-opacity: 0.38;
  --word-hover-shadow: 0 0 4px rgba(220, 232, 255, 0.12);
  --title-muted-color: rgba(255, 255, 255, 0.46);
  --title-main-color: rgba(255, 255, 255, 1);
  --body-color: rgba(255, 255, 255, 0.72);
  --body-strong-color: rgba(255, 255, 255, 1);
  --edge-blend-color: rgb(var(--color-bg) / 0.98);
  --edge-blend-top: 9%;
}

.tilt-wall__scene {
  position: absolute;
  inset: 0;
  width: var(--scene-width);
  height: var(--scene-height);
  z-index: 0;
  pointer-events: auto;
}

.tilt-wall__text-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
}

.tilt-wall__grain {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  opacity: var(--grain-opacity);
  background-image: radial-gradient(circle at 1px 1px, var(--grain-dot) 0.7px, transparent 0.8px);
  background-size: 2px 2px;
}

.tilt-wall__vignette {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background:
    radial-gradient(120% 105% at 50% 50%, var(--vignette-center) 48%, var(--vignette-edge) 100%),
    linear-gradient(to right, var(--vignette-side) 0%, rgba(2, 3, 6, 0) 16%, rgba(2, 3, 6, 0) 84%, var(--vignette-side) 100%),
    linear-gradient(to bottom, var(--vignette-top) 0%, rgba(2, 3, 6, 0) 16%, rgba(2, 3, 6, 0) 84%, var(--vignette-bottom) 100%);
}

.tilt-wall__edge-blend {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    var(--edge-blend-color) 0%,
    transparent var(--edge-blend-top),
    transparent calc(100% - var(--edge-blend-y)),
    var(--edge-blend-color) 100%
  );
}

.tilt-wall__stripe {
  position: absolute;
  top: calc(var(--stripe-start) + (var(--stripe-index) * var(--stripe-step)));
  left: var(--stripe-left);
  width: var(--stripe-width);
  transform: rotate(var(--tilt-angle));
  white-space: nowrap;
}

.tilt-wall__track {
  display: flex;
  gap: var(--stripe-gap);
  width: max-content;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  will-change: transform;
  animation-name: tilt-slide;
  animation-duration: var(--tilt-duration, 96s);
  animation-delay: var(--tilt-delay, 0s);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-direction: var(--tilt-direction, normal);
}

.tilt-wall.tilt-wall--paused .tilt-wall__track {
  animation-play-state: paused;
}

.tilt-wall.tilt-wall--lite .tilt-wall__text-layer {
  pointer-events: none;
}

.tilt-wall.tilt-wall--lite .tilt-wall__word {
  transition: none;
}

.tilt-wall__word-line {
  font-size: var(--word-size);
  line-height: 0.92;
  letter-spacing: -0.03em;
  font-weight: 900;
  color: var(--word-color);
  opacity: var(--word-opacity);
  user-select: none;
  text-transform: none;
  white-space: nowrap;
  padding-right: var(--stripe-gap);
}

.tilt-wall__word {
  position: relative;
  font-size: var(--word-size);
  line-height: 0.92;
  letter-spacing: -0.03em;
  font-weight: 900;
  color: var(--word-color);
  opacity: var(--word-opacity);
  user-select: none;
  text-transform: none;
  transition:
    color 220ms ease,
    opacity 220ms ease;
}

.tilt-wall__content {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.75rem 1.25rem;
  pointer-events: none;
}

.tilt-wall__content-inner {
  width: min(100%, 1160px);
}

.tilt-wall__title-muted {
  color: var(--title-muted-color);
}

.tilt-wall__title-main {
  color: var(--title-main-color);
}

.tilt-wall__title-line {
  white-space: nowrap;
}

.tilt-wall__body {
  color: var(--body-color);
}

.tilt-wall__body-strong {
  color: var(--body-strong-color);
}

@keyframes tilt-slide {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 1280px) {
  .tilt-wall {
    --wall-height: 40rem;
    --stripe-start: 2%;
    --stripe-step: 22%;
  }
}

@media (max-width: 768px) {
  .tilt-wall-section {
    content-visibility: auto;
    contain-intrinsic-size: 620px;
  }

  .tilt-wall {
    --wall-height: 34rem;
    --word-size: clamp(6.1rem, 10vw, 7.3rem);
    --stripe-start: 2%;
    --stripe-step: 18%;
  }

  .tilt-wall__content {
    padding: 2rem 1.25rem;
  }

  .tilt-wall__title-line {
    font-size: clamp(1.32rem, 6.8vw, 2.05rem);
    line-height: 1.22;
  }

  .tilt-wall__headline {
    margin-left: 0;
    margin-right: 0;
  }
}

@media (max-width: 430px) {
  .tilt-wall {
    --wall-height: 31rem;
    --word-size: clamp(5.2rem, 12.8vw, 6.2rem);
    --stripe-start: 3%;
    --stripe-step: 21%;
  }
}

@media (pointer: coarse) {
  .tilt-wall__text-layer {
    pointer-events: none;
  }

  .tilt-wall__word {
    transition: none;
  }
}

@media (pointer: fine) {
  .tilt-wall:not(.tilt-wall--lite) .tilt-wall__stripe:hover .tilt-wall__track {
    animation-play-state: paused;
  }

  .tilt-wall:not(.tilt-wall--lite) .tilt-wall__word:hover {
    color: var(--word-hover-color);
    opacity: var(--word-hover-opacity);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tilt-wall__track {
    animation: none;
    transform: translateX(0);
  }
}
</style>
