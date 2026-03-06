<template>
  <AppLayout>
    <div class="showcase-page">
      <div class="showcase-hero-region">
        <!-- Hero：标题 + 副标题 -->
        <section class="showcase-hero relative z-10">
          <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-8">
            <div class="mx-auto w-full max-w-208 text-center">
              <h1 class="showcase-hero__title">
                Showcase
              </h1>
              <p class="showcase-hero__subtitle">
                在这里体验我们的原型与技术实验，探索新的交互方式与工程实现。
              </p>
            </div>
          </div>
        </section>

        <!-- 单轨封面轮播：单 strip 内列表重复两份，-50% 平移实现无缝循环 -->
        <section class="showcase-marquee relative z-10" aria-label="Showcase 列表">
          <div
            ref="viewportRef"
            class="showcase-marquee__viewport"
            @mousemove="onViewportMouseMove"
            @mouseleave="onViewportMouseLeave"
            @touchstart.passive="onViewportTouchStart"
            @touchmove="onViewportTouchMove"
            @touchend="onViewportTouchEnd"
            @click.capture="onViewportClickCapture"
          >
            <!-- 左右悬浮加速区：鼠标在左/右区域内时，轨道向反方向加速滚动 -->
            <div class="showcase-marquee__zone showcase-marquee__zone--left" aria-hidden="true" />
            <div class="showcase-marquee__zone showcase-marquee__zone--right" aria-hidden="true" />
            <div
              ref="trackRef"
              class="showcase-marquee__track"
              :class="{
                'showcase-marquee__track--paused': isTrackPaused,
                'showcase-marquee__track--zone-driven': isTrackJsDriven,
              }"
              :style="zoneTrackStyle"
            >
              <div class="showcase-marquee__strip">
                <RouterLink
                  v-for="(demo, index) in marqueeList"
                  :key="`marquee-${index}-${demo.id}`"
                  :to="`/showcase/${demo.id}`"
                  class="showcase-marquee__card group"
                  @mouseenter="onCardEnter(index % showcaseList.length)"
                  @mouseleave="onCardLeave"
                  @focus="onCardEnter(index % showcaseList.length)"
                  @blur="onCardLeave"
                >
                  <div class="showcase-marquee__cover-wrap">
                    <CoverImage
                      class="showcase-marquee__cover"
                      :src="demo.cover"
                      :src-set="demo.coverSrcSet"
                      :video-src="demo.coverVideo"
                      :icon-class="demo.coverIcon"
                      :enable-video-cover="false"
                      sizes="(max-width: 768px) 85vw, 480px"
                      :alt="demo.title"
                      image-class="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                  <div class="showcase-marquee__card-title">{{ demo.title }}</div>
                  <p class="showcase-marquee__card-desc">{{ demo.shortDesc }}</p>
                </RouterLink>
              </div>
            </div>
          </div>
        </section>

        <p class="showcase-disclaimer relative z-10 mx-auto w-full max-w-360 px-14 pt-6 pb-8 text-center text-sm leading-relaxed text-secondary max-lg:px-6 max-md:px-5">
          这些演示项目主要用于技术探索与概念验证，其功能与表现形式可能随时调整，不代表最终产品形态。
        </p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { RouterLink } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import CoverImage from "../components/CoverImage.vue";
import { showcaseList } from "../data/showcase";

/** 轮播用列表：同一列表重复两份，单 strip -50% 平移即可无缝循环 */
const marqueeList = [...showcaseList, ...showcaseList];

/** 当前悬浮/聚焦的卡片索引，用于轮播悬停暂停 */
const hoveredCardIndex = ref(null);

/** 轮播是否暂停（悬停或聚焦时为 true） */
const isTrackPaused = computed(() => hoveredCardIndex.value !== null);

const onCardEnter = (index) => {
  hoveredCardIndex.value = index;
};
const onCardLeave = () => {
  hoveredCardIndex.value = null;
};

// --- 左右悬浮区加速滚动 ---
const viewportRef = ref(null);
const trackRef = ref(null);

/** 感应区宽度（视口宽度比例），左右各一块 */
const ZONE_WIDTH_RATIO = 0.12;
/** 基础速度：每帧位移（占 strip 宽度的比例） */
const BASE_SPEED = 0.0008;
/** 加速度（每帧增加的速度） */
const ACCELERATION = 0.000015;
/** 最大速度（占 strip 宽度比例/帧） */
const MAX_SPEED = 0.028;

/** 当前处于哪一侧感应区：'left' | 'right' | null */
const activeZone = ref(null);
/** 由感应区驱动的轨道 translateX（百分比），仅在与 CSS 动画切换时用于同步 */
const zoneTranslatePercent = ref(-0);
/** 当前速度（正=向右，负=向左），仅 zone 驱动时使用 */
const zoneVelocity = ref(0);

const isZoneDriven = computed(() => activeZone.value !== null);

// 移动端触摸拖拽
const isTouchDragging = ref(false);
const touchStartX = ref(0);
const touchStartTranslatePercent = ref(0);
const touchDragOffsetPercent = ref(0);
/** 本次触摸是否发生了拖拽，用于阻止松手后的误点链接 */
const hadTouchDragged = ref(false);

/** 由 JS 驱动轨道时（感应区或触摸拖拽）需要关闭 CSS 动画 */
const isTrackJsDriven = computed(() => isZoneDriven.value || isTouchDragging.value);

const zoneTrackStyle = computed(() => {
  if (isTouchDragging.value) {
    const p = touchStartTranslatePercent.value + touchDragOffsetPercent.value;
    return { transform: `translateX(${p}%)` };
  }
  if (isZoneDriven.value) {
    return { transform: `translateX(${zoneTranslatePercent.value}%)` };
  }
  // 非 JS 驱动时只带 animationDelay，保证自动轮播从正确进度继续
  if (marqueeAnimationDelay.value) {
    return { animationDelay: marqueeAnimationDelay.value };
  }
  return undefined;
});

function getTrackTranslatePercent() {
  const el = trackRef.value;
  if (!el) return 0;
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  // matrix(a, b, c, d, tx, ty) — 水平位移是第 5 个值 tx，不是第一个 scaleX
  const parts = t.match(/matrix\((.+)\)/)?.[1].split(",").map((s) => parseFloat(s.trim()));
  const tx = parts && parts.length >= 5 ? parts[4] : 0;
  const trackWidth = el.scrollWidth;
  if (!trackWidth) return 0;
  return (tx / trackWidth) * 100;
}

/** 节流用：待处理的最近一次 mousemove 事件 */
let pendingMoveEvent = null;
let moveRafId = null;

function doViewportMouseMove(e) {
  const vp = viewportRef.value;
  if (!vp) return;
  const rect = vp.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const w = rect.width;
  const zoneW = w * ZONE_WIDTH_RATIO;
  if (x >= 0 && x < zoneW) {
    if (activeZone.value !== "left") {
      activeZone.value = "left";
      zoneTranslatePercent.value = getTrackTranslatePercent();
      zoneVelocity.value = BASE_SPEED * 100;
    }
  } else if (x > w - zoneW && x <= w) {
    if (activeZone.value !== "right") {
      activeZone.value = "right";
      zoneTranslatePercent.value = getTrackTranslatePercent();
      zoneVelocity.value = -BASE_SPEED * 100;
    }
  } else {
    activeZone.value = null;
  }
}

function onViewportMouseMove(e) {
  pendingMoveEvent = e;
  if (moveRafId !== null) return;
  moveRafId = requestAnimationFrame(() => {
    moveRafId = null;
    const ev = pendingMoveEvent;
    pendingMoveEvent = null;
    if (ev) doViewportMouseMove(ev);
  });
}

function onViewportMouseLeave() {
  pendingMoveEvent = null;
  if (moveRafId) {
    cancelAnimationFrame(moveRafId);
    moveRafId = null;
  }
  activeZone.value = null;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function onViewportTouchStart(e) {
  if (e.touches.length !== 1) return;
  const track = trackRef.value;
  if (!track) return;
  isTouchDragging.value = true;
  hadTouchDragged.value = false;
  touchStartX.value = e.touches[0].clientX;
  touchStartTranslatePercent.value = getTrackTranslatePercent();
  touchDragOffsetPercent.value = 0;
}

function onViewportTouchMove(e) {
  if (!isTouchDragging.value || e.touches.length !== 1) return;
  const track = trackRef.value;
  if (!track) return;
  const trackWidth = track.scrollWidth;
  if (!trackWidth) return;
  const deltaPx = e.touches[0].clientX - touchStartX.value;
  touchDragOffsetPercent.value = (deltaPx / trackWidth) * 100;
  if (Math.abs(deltaPx) > 8) {
    hadTouchDragged.value = true;
    e.preventDefault();
  }
}

function onViewportTouchEnd() {
  if (!isTouchDragging.value) return;
  let p = touchStartTranslatePercent.value + touchDragOffsetPercent.value;
  while (p > 0) p -= 50;
  while (p < -50) p += 50;
  syncMarqueeAnimationFromPercent(p);
  isTouchDragging.value = false;
  touchDragOffsetPercent.value = 0;
}

function onViewportClickCapture(e) {
  if (hadTouchDragged.value) {
    e.preventDefault();
    e.stopPropagation();
    hadTouchDragged.value = false;
  }
}

let rafId = null;
function tick() {
  const zone = activeZone.value;
  if (zone === null) {
    rafId = null;
    return;
  }
  if (!trackRef.value) {
    rafId = null;
    return;
  }
  let v = zoneVelocity.value;
  if (zone === "left") {
    v = Math.min(MAX_SPEED * 100, v + ACCELERATION * 100);
    zoneVelocity.value = v;
    zoneTranslatePercent.value += v;
  } else {
    v = Math.max(-MAX_SPEED * 100, v - ACCELERATION * 100);
    zoneVelocity.value = v;
    zoneTranslatePercent.value += v;
  }
  let p = zoneTranslatePercent.value;
  if (p > 0) zoneTranslatePercent.value = p - 50;
  else if (p < -50) zoneTranslatePercent.value = p + 50;
  rafId = requestAnimationFrame(tick);
}

/** 离开 zone/触摸后要让动画从当前进度继续时的 delay（秒），空字符串表示从 0 开始 */
const marqueeAnimationDelay = ref("");

/** 用 animation-delay 让 CSS 动画从指定位移继续；由 Vue :style 绑定，避免被覆盖 */
function syncMarqueeAnimationFromPercent(percent) {
  const progress = Math.max(0, Math.min(1, -percent / 50));
  marqueeAnimationDelay.value = `${-progress * 60}s`;
}

watch(activeZone, (newZone, oldZone) => {
  if (newZone !== null && !rafId) rafId = requestAnimationFrame(tick);
  if (oldZone != null && newZone === null && trackRef.value) {
    syncMarqueeAnimationFromPercent(zoneTranslatePercent.value);
  }
});

onUnmounted(() => {
  if (moveRafId) cancelAnimationFrame(moveRafId);
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.showcase-page {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  min-width: 0;
  box-sizing: border-box;
}

.showcase-hero__title {
  font-size: clamp(2rem, 4vw + 1.5rem, 4rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 500;
  color: rgb(var(--color-text-primary));
  margin: 0;
}
.showcase-hero__subtitle {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(var(--color-text-primary) / 0.85);
}
.showcase-intro {
  margin: 0;
}

.showcase-hero-region {
  position: relative;
  max-width: 100%;
  overflow-x: hidden;
  min-width: 0;
}

/* 轮播：全宽视口 + 单 strip 双份列表无缝循环；min-width:0 防止被内部 max-content 撑开 */
.showcase-marquee {
  padding: 0;
  margin: 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.showcase-marquee__viewport {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding-top: 0.5rem;
  padding-bottom: 1rem;
}

/* 左右感应区：仅用于检测悬浮，不阻挡点击（pointer-events 由下方 track 穿透） */
.showcase-marquee__zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12%;
  max-width: 120px;
  z-index: 1;
  pointer-events: none;
}
.showcase-marquee__zone--left {
  left: 0;
}
.showcase-marquee__zone--right {
  right: 0;
}

.showcase-marquee__track {
  display: flex;
  width: max-content;
  flex-shrink: 0;
  animation: showcase-marquee-scroll 60s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .showcase-marquee__track {
    animation-duration: 120s;
  }
}

/* 仅悬浮在卡片上时暂停，不因整块轮播区 hover 而暂停，保证自动轮播可见 */
.showcase-marquee__track--paused {
  animation-play-state: paused;
}

/* 由左右感应区驱动时，完全由 JS 控制 transform，关闭 CSS 动画 */
.showcase-marquee__track--zone-driven {
  animation: none;
}

/* 单 strip 内列表重复两份，-50% 平移即为一组宽度，无缝循环；高度由封面+标题+描述自然撑开 */
.showcase-marquee__strip {
  display: flex;
  flex-shrink: 0;
  gap: 1.25rem;
  padding: 0 0.625rem;
  align-items: flex-start;
}

/* 桌面端：最小高度 = 封面高（正方形）+ 标题一行 + 描述两行 + 内边距，不写死过大空间 */
@media (min-width: 769px) {
  .showcase-marquee__strip {
    min-height: calc(min(480px, 85vw) + 5.25rem);
  }
}

/* 无容器：仅封面 + 文字，无背景/阴影/边框包裹；封面尺寸缩小 */
.showcase-marquee__card {
  flex-shrink: 0;
  width: 480px;
  max-width: 85vw;
  display: block;
  overflow: visible;
  transition: opacity 0.25s ease, filter 0.25s ease;
}

/* 悬浮某张卡片时，其他封面变灰 */
.showcase-marquee__track:has(.showcase-marquee__card:hover) .showcase-marquee__card {
  opacity: 0.42;
  filter: grayscale(0.75);
}

.showcase-marquee__track:has(.showcase-marquee__card:hover) .showcase-marquee__card:hover {
  opacity: 1;
  filter: grayscale(0);
}

.showcase-marquee__cover-wrap {
  aspect-ratio: 1 / 1;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
  background: rgb(var(--color-line) / 0.12);
}

.showcase-marquee__cover {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

/* 标题与描述：左对齐，桌面端默认不显示，悬浮后显示；移动端始终显示 */
.showcase-marquee__card-title {
  margin: 0;
  padding: 1rem 0 0.25rem;
  font-size: 1.0625rem;
  font-weight: 600;
  color: rgb(var(--color-text-primary));
  text-align: left;
  line-height: 1.35;
  letter-spacing: -0.01em;
  transition: opacity 0.22s ease, max-height 0.26s ease, padding 0.26s ease;
}

.showcase-marquee__card-desc {
  margin: 0;
  padding: 0 0 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(var(--color-text-primary) / 0.7);
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: opacity 0.22s ease, max-height 0.26s ease, padding 0.26s ease;
}

/* 桌面端：标题与描述默认隐藏，悬浮当前项后显示 */
@media (min-width: 769px) {
  .showcase-marquee__card-title {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
    overflow: hidden;
  }

  .showcase-marquee__card-desc {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
    overflow: hidden;
  }

  .showcase-marquee__card:hover .showcase-marquee__card-title {
    max-height: 3.5em;
    padding: 1rem 0 0.25rem;
    opacity: 1;
  }

  .showcase-marquee__card:hover .showcase-marquee__card-desc {
    max-height: 5em;
    padding: 0 0 1rem;
    opacity: 1;
  }
}

/* 固定 keyframes 保证自动轮播一定生效；从中间继续用 animation-delay 控制 */
@keyframes showcase-marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
