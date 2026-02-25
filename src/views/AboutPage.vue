<template>
  <AppLayout>
    <!-- Hero: 左文字右图片、左右底部对齐 -->
    <section class="about-hero mx-auto w-full max-w-360 px-14 pt-24 pb-16 max-md:pt-20 max-md:pb-10 max-lg:px-6">
      <div class="about-hero-grid flex w-full flex-col gap-10 md:flex-row md:items-end md:gap-8 lg:gap-12 xl:gap-x-16">
        <div class="about-hero-copy order-1 flex min-w-0 flex-col md:flex-1 md:justify-end xl:pb-0">
          <div class="mb-5 text-sm">
            <span class="text-secondary">关于我们</span>
          </div>
          <h1
            class="about-hero-title max-w-[28em] text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),3.75rem)] font-medium leading-[1.2] tracking-[-0.03em] text-primary"
          >
            以技术驱动，<br>助力企业数字化
          </h1>
          <p class="mt-4 text-base leading-[1.72] text-primary/80">
            我们是企丰科技，专注企业信息化系统开发与技术服务，用创意融合技术，助力商业持续增长。
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <span class="btn-primary btn-md gap-2 px-5 inline-flex items-center cursor-default">
              联系我们
              <i class="ri-arrow-right-line text-base" aria-hidden="true"></i>
            </span>
            <RouterLink to="/projects" class="btn-secondary btn-md gap-2 px-5">
              客户案例
            </RouterLink>
          </div>
        </div>
        <div class="about-hero-media order-2 flex justify-center md:flex-1 md:min-w-0 xl:shrink-0 xl:min-w-[560px] xl:max-w-[min(58%,864px)] xl:flex-[1.15]">
          <!-- 移动端图在文下；与桌面端一致保持 1:1 宽高比 -->
          <div class="about-hero-image-wrap relative w-full overflow-hidden rounded-2xl bg-[rgb(var(--color-line)/0.08)] aspect-square">
            <img
              :src="heroImage"
              :srcset="heroImageSrcSet"
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, (min-width: 1440px) 864px, 58vw"
              alt="企丰科技团队与产品"
              class="about-hero-img absolute inset-0 h-full w-full object-cover object-bottom"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 项目封面：桌面端轮播动画，移动端与项目页「更多项目」完全一致（无切换无动画） -->
    <section class="about-logos w-full max-md:mt-6">
      <!-- 桌面端：轮播，与 hero 同宽 -->
      <div class="max-md:hidden mx-auto w-full max-w-360 px-14 py-14 max-lg:px-6">
        <div class="mb-8 text-center">
          <h2 class="text-lg font-medium tracking-[-0.02em] text-primary md:text-3xl">
            信任我们的企业与伙伴
          </h2>
        </div>
        <div class="about-covers-grid grid grid-cols-4 gap-6 max-lg:grid-cols-2 min-w-0">
          <RouterLink
            v-for="(_, slotIndex) in 4"
            :key="slotIndex"
            :to="`/project/${coverSlots[slotIndex].current.id}`"
            class="group block min-w-0"
          >
            <div class="about-card-slot relative min-w-0 overflow-hidden">
              <div class="aspect-square w-full invisible" aria-hidden="true"></div>
              <div class="h-[5.5rem] invisible" aria-hidden="true"></div>
              <div
                class="about-card-layer absolute inset-0 flex flex-col about-logo-current"
                :class="{ 'about-logo-slide-out': isFlipped, 'about-logo-reset': isResetting }"
                :style="slideDelayStyles[slotIndex].current"
                @transitionend="onSlideTransitionEnd($event, slotIndex)"
              >
                <div class="about-cover-block relative aspect-square w-full shrink-0 overflow-hidden rounded-sm">
                  <img
                    :key="`${slotIndex}-0-${baseStep}`"
                    :src="coverSlots[slotIndex].current.src"
                    :srcset="coverSlots[slotIndex].current.srcSet"
                    :alt="coverSlots[slotIndex].current.name"
                    class="about-cover-img absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="about-caption-block shrink-0 pt-3 text-left">
                  <div class="text-lg leading-[1.3] font-medium text-primary">{{ coverSlots[slotIndex].current.name }}</div>
                  <div class="mt-4 flex items-center gap-2 text-sm">
                    <span class="font-medium text-primary">{{ coverSlots[slotIndex].current.primaryMeta }}</span>
                    <span class="text-secondary">{{ coverSlots[slotIndex].current.secondaryMeta }}</span>
                  </div>
                </div>
              </div>
              <div
                class="about-card-layer absolute inset-0 flex flex-col about-logo-next"
                :class="{ 'about-logo-slide-in': isFlipped, 'about-logo-reset': isResetting }"
                :style="slideDelayStyles[slotIndex].next"
              >
                <div class="about-cover-block relative aspect-square w-full shrink-0 overflow-hidden rounded-sm">
                  <img
                    :key="`${slotIndex}-1-${baseStep}`"
                    :src="coverSlots[slotIndex].next.src"
                    :srcset="coverSlots[slotIndex].next.srcSet"
                    :alt="coverSlots[slotIndex].next.name"
                    class="about-cover-img absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="about-caption-block shrink-0 pt-3 text-left">
                  <div class="text-lg leading-[1.3] font-medium text-primary">{{ coverSlots[slotIndex].next.name }}</div>
                  <div class="mt-4 flex items-center gap-2 text-sm">
                    <span class="font-medium text-primary">{{ coverSlots[slotIndex].next.primaryMeta }}</span>
                    <span class="text-secondary">{{ coverSlots[slotIndex].next.secondaryMeta }}</span>
                  </div>
                </div>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
      <!-- 移动端：与项目页「更多项目」完全一致，无切换无动画 -->
      <div class="md:hidden w-full -mt-4">
        <RelatedContentSection
          title="信任我们的企业与伙伴"
          view-all-to="/projects"
          :items="mobileProjectItems"
          :item-to="projectItemTo"
          :primary-meta="projectPrimaryMeta"
          :secondary-meta="projectSecondaryMeta"
        />
      </div>
    </section>

    <!-- 关于企丰科技：桌面端使用较窄内容宽度（参考页非全宽），图片竖向长方形，参考「使用 AI 为员工赋能」 -->
    <section class="about-intro mx-auto w-full max-w-[72rem] px-14 max-lg:px-6" aria-labelledby="about-intro-heading">

      <!-- Block 1: 左文右图（移动端图在上） -->
      <div class="about-intro-block pt-10 md:pt-20">
        <div class="about-intro-inner flex flex-col gap-10 md:flex-row md:items-center md:gap-14 lg:gap-20">
          <div class="about-intro-copy order-2 min-w-0 md:order-1 md:max-w-[28rem] md:shrink-0">
            <h3 class="about-intro-h3 mb-6 text-2xl font-medium tracking-[-0.02em] text-primary md:text-3xl">以技术驱动为核心</h3>
            <p class="text-base leading-[1.8] text-primary md:text-lg">
              企丰科技专注企业信息化系统开发与技术服务，深耕软件研发多年，服务多家企业与品牌，涵盖企业级后台、数据平台、智能硬件与物联网、以及面向 C 端的应用与小程序。我们相信，好的数字化项目不只是上线那一刻的完成，而是在多年之后依然稳定运行，能够随着业务发展不断扩展与优化。
            </p>
          </div>
          <div class="about-intro-media order-1 min-w-0 flex-1 md:order-2">
            <div class="about-intro-image-wrap group relative w-full overflow-hidden rounded-lg bg-[rgb(var(--color-line)/0.06)]">
              <img
                :src="introImage1"
                alt="企丰科技产品与方案"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Block 2: 左图右文（移动端图在上） -->
      <div class="about-intro-block pt-10 md:pt-20">
        <div class="about-intro-inner flex flex-col gap-10 md:flex-row md:items-center md:gap-14 lg:gap-20">
          <div class="about-intro-copy order-2 min-w-0 md:order-2 md:max-w-[28rem] md:shrink-0">
            <h3 class="about-intro-h3 mb-6 text-2xl font-medium tracking-[-0.02em] text-primary md:text-3xl">理解问题，对齐目标</h3>
            <p class="text-base leading-[1.8] text-primary md:text-lg">
              在每一个项目开始之前，我们都会花时间理解问题本身。需求阶段由产品、设计、研发、测试与项目管理共同参与，对齐目标、边界与优先级。我们强调结构清晰、逻辑明确，进入迭代后关注可验证的结果与质量标准。我们交付的不只是代码，而是一套真正能够运转的系统、一份稳定可靠的技术支持。
            </p>
          </div>
          <div class="about-intro-media order-1 min-w-0 flex-1 md:order-1">
            <div class="about-intro-image-wrap group relative w-full overflow-hidden rounded-lg bg-[rgb(var(--color-line)/0.06)]">
              <img
                :src="introImage2"
                alt="企丰科技项目协作"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Block 3: 左文右图（移动端图在上） -->
      <div class="about-intro-block pb-4 pt-10 md:pt-20">
        <div class="about-intro-inner flex flex-col gap-10 md:flex-row md:items-center md:gap-14 lg:gap-20">
          <div class="about-intro-copy order-2 min-w-0 md:order-1 md:max-w-[28rem] md:shrink-0">
            <h3 class="about-intro-h3 mb-6 text-2xl font-medium tracking-[-0.02em] text-primary md:text-3xl">长期可用，持续演进</h3>
            <p class="text-base leading-[1.8] text-primary md:text-lg">
              无论是云柜宝、水环境智慧监控等自研产品，还是为客户定制的信息化系统，我们始终坚持以长期可用性为前提，用工程能力与产品思维助力企业数字化落地。
            </p>
            <div class="mt-8 flex flex-col items-start gap-3">
              <RouterLink to="/ygb" class="btn-text btn-text-primary inline-flex items-center gap-2 text-base md:text-lg">
                云柜宝
                <i class="ri-arrow-right-line text-sm" aria-hidden="true"></i>
              </RouterLink>
              <RouterLink to="/water-env" class="btn-text btn-text-primary inline-flex items-center gap-2 text-base md:text-lg">
                水环境智慧监控
                <i class="ri-arrow-right-line text-sm" aria-hidden="true"></i>
              </RouterLink>
            </div>
          </div>
          <div class="about-intro-media order-1 min-w-0 flex-1 md:order-2">
            <div class="about-intro-image-wrap group relative w-full overflow-hidden rounded-lg bg-[rgb(var(--color-line)/0.06)]">
              <img
                :src="introImage3"
                alt="企丰科技自研产品"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部 CTA：全宽灰色容器，整合联系页内容 -->
    <section id="contact" class="w-full max-w-360 mx-auto py-10">
      <div class="mx-auto w-full px-16 max-xl:px-6 max-md:px-5">
        <div class="bg-black/4.5 px-3 py-6 md:py-24 rounded-md dark:bg-white/6">
          <div class="mx-auto flex w-full max-w-[40rem] flex-col gap-8">
            <h2 class="text-2xl md:text-4xl font-medium tracking-[-0.02em] text-primary text-center">联系我们</h2>

            <article class="font-sans text-base leading-relaxed text-primary overflow-x-clip">
              <div class="markdown-body detail-markdown-body contact-markdown flex flex-col gap-6">
                <p>
                  扫码添加企业微信，可快速发起项目咨询并获取合作支持。无论你是希望咨询项目合作、了解产品方案，还是希望讨论长期技术支持，我们都欢迎你随时联系我们。我们重视每一次沟通，会尽快响应并给出明确反馈。若你已有明确需求，也可以直接留言项目背景、目标与时间计划，便于我们更高效地对接。
                </p>
                <div
                  ref="qrCardRef"
                  class="qr-tilt-card mx-auto w-full max-w-72"
                  :style="qrCardStyle"
                  @pointermove="handleQrPointerMove"
                  @pointerleave="resetQrTilt"
                >
                  <img
                    :src="wecomQrCode"
                    alt="企业微信二维码"
                    class="block h-auto w-full rounded-xl border border-edge bg-white p-3"
                  />
                  <span class="qr-tilt-glare" aria-hidden="true"></span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import RelatedContentSection from "../components/RelatedContentSection.vue";
import "../styles/markdown-media.css";

import heroImage from "../assets/about-01.webp";
import heroImageSrcSet from "../assets/about-01.webp?w=480;640;800;960;1200&format=webp&as=srcset";

import introImage1 from "../assets/about-02.webp";
import introImage2 from "../assets/about-03.webp";
import introImage3 from "../assets/about-04.webp";

import wecomQrCode from "../assets/wecom-qrcode.webp";

import { projectList } from "../data/projects";

const qrCardRef = ref(null);
const qrCardStyle = ref({
  transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
  "--glare-x": "50%",
  "--glare-y": "50%",
  "--glare-opacity": "0",
});

/** 是否允许二维码倾斜动画，在 onMounted 中初始化，避免每次 pointermove 调用 matchMedia */
let canAnimateQrCache = false;
let qrRafId = null;
/** 当前帧内待应用的倾斜样式，供 rAF 回调使用最新值 */
let pendingQrStyle = null;

const handleQrPointerMove = (event) => {
  if (!canAnimateQrCache || !qrCardRef.value) return;
  const rect = qrCardRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const px = x / rect.width;
  const py = y / rect.height;
  const rotateX = (0.5 - py) * 16;
  const rotateY = (px - 0.5) * 18;
  pendingQrStyle = {
    transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.045)`,
    "--glare-x": `${(px * 100).toFixed(2)}%`,
    "--glare-y": `${(py * 100).toFixed(2)}%`,
    "--glare-opacity": "0.95",
  };
  if (qrRafId != null) return;
  qrRafId = requestAnimationFrame(() => {
    qrRafId = null;
    if (pendingQrStyle) {
      qrCardStyle.value = pendingQrStyle;
      pendingQrStyle = null;
    }
  });
};

const resetQrTilt = () => {
  if (qrRafId != null) {
    cancelAnimationFrame(qrRafId);
    qrRafId = null;
  }
  pendingQrStyle = null;
  qrCardStyle.value = {
    transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
    "--glare-x": "50%",
    "--glare-y": "50%",
    "--glare-opacity": "0",
  };
};

const baseStep = ref(0);
const isFlipped = ref(false);
const isResetting = ref(false);
let flipTimer = null;
let mediaQuery = null;
let mediaChangeHandler = null;

const coverList = projectList.length >= 4 ? projectList : [...projectList, ...projectList, ...projectList].slice(0, Math.max(4, projectList.length));

function coverForSlot(slotIndex, face) {
  const idx = (baseStep.value + slotIndex + face) % coverList.length;
  const p = coverList[idx];
  return {
    id: p.id,
    src: p.cover,
    srcSet: p.coverSrcSet || "",
    name: p.title || "项目",
    primaryMeta: p.tag || "",
    secondaryMeta: p.yearLabel || p.year || "",
  };
}

const coverSlots = computed(() => {
  return Array.from({ length: 4 }, (_, slotIndex) => ({
    current: coverForSlot(slotIndex, 0),
    next: coverForSlot(slotIndex, 1),
  }));
});

const SLIDE_DELAY_PER_SLOT = 0.12;
/** 新图比原图提前开始的时间，使新图更早出现 */
const SLIDE_NEXT_EARLY = 0.06;

const slideDelayStyles = computed(() => {
  if (!isFlipped.value) {
    return Array.from({ length: 4 }, () => ({ current: { transitionDelay: "0s" }, next: { transitionDelay: "0s" } }));
  }
  return Array.from({ length: 4 }, (_, slotIndex) => {
    const delayCurrent = slotIndex * SLIDE_DELAY_PER_SLOT;
    const delayNext = slotIndex * SLIDE_DELAY_PER_SLOT - SLIDE_NEXT_EARLY;
    return {
      current: { transitionDelay: `${Math.max(0, delayCurrent)}s` },
      next: { transitionDelay: `${Math.max(0, delayNext)}s` },
    };
  });
});

/** 移动端展示的项目列表，与项目页「更多项目」一致取前 3 项（直接用 projectList 保证有数据） */
const mobileProjectItems = computed(() => projectList.slice(0, 3));

const projectItemTo = (item) => `/project/${item.id}`;
const projectPrimaryMeta = (item) => item.tag || "";
const projectSecondaryMeta = (item) => item.yearLabel || item.year || "";

function startSlide() {
  if (isFlipped.value || isResetting.value) return;
  isFlipped.value = true;
}

function onSlideTransitionEnd(e, slotIndex) {
  if (!["transform", "opacity"].includes(e.propertyName) || !isFlipped.value) return;
  if (slotIndex !== 3) return;
  isResetting.value = true;
  baseStep.value += 1;
  isFlipped.value = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isResetting.value = false;
    });
  });
}

onMounted(() => {
  // 刷新时若 URL 带 #contact，回到顶部并去掉 hash，避免重复滚到 CTA
  const navEntry = performance.getEntriesByType?.("navigation")?.[0];
  if (navEntry?.type === "reload" && window.location.hash === "#contact") {
    window.scrollTo(0, 0);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  canAnimateQrCache =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  mediaQuery = window.matchMedia("(min-width: 768px)");
  const startTimer = () => {
    if (flipTimer) return;
    if (mediaQuery.matches) flipTimer = setInterval(startSlide, 3500);
  };
  const stopTimer = () => {
    if (flipTimer) {
      clearInterval(flipTimer);
      flipTimer = null;
    }
  };
  mediaChangeHandler = (e) => (e.matches ? startTimer() : stopTimer());
  mediaQuery.addEventListener("change", mediaChangeHandler);
  startTimer();
});

onUnmounted(() => {
  if (flipTimer) clearInterval(flipTimer);
  if (mediaQuery && mediaChangeHandler) {
    mediaQuery.removeEventListener("change", mediaChangeHandler);
    mediaQuery = null;
    mediaChangeHandler = null;
  }
});
</script>

<style scoped>
.about-hero-title {
  letter-spacing: -0.03em;
}

/* 平板 + 小桌面：768px–1279px 左右 50-50 */
@media (min-width: 768px) {
  .about-hero-grid {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
  }

  .about-hero-copy {
    min-height: 0;
    flex: 1;
    order: 1;
  }

  .about-hero-media {
    flex: 1;
    min-width: 0;
    order: 2;
  }
}

/* 大桌面：≥1280px 右侧图片更大 */
@media (min-width: 1280px) {
  .about-hero-media {
    flex: 1.15;
    min-width: 560px;
    max-width: min(58%, 864px);
    flex-shrink: 0;
  }
}

/* 关于企丰科技：竖图宽高比与桌面端一致，移动端也保持 3:4 */
.about-intro-image-wrap {
  aspect-ratio: 3 / 4;
}

.about-intro-h3 {
  letter-spacing: -0.02em;
}

/* 项目封面 slot：与项目页卡片一致为方形 */

.about-logo-current,
.about-logo-next {
  transition:
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.about-logo-current {
  transform: translateY(0);
  opacity: 1;
}

.about-logo-current.about-logo-slide-out {
  transform: translateY(-18%);
  opacity: 0;
}

.about-logo-next {
  transform: translateY(18%);
  opacity: 0;
}

.about-logo-next.about-logo-slide-in {
  transform: translateY(0);
  opacity: 1;
}

.about-logo-current.about-logo-reset,
.about-logo-next.about-logo-reset {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .about-logo-current,
  .about-logo-next {
    transition: none;
  }
}

/* 底部 CTA 内联系内容：二维码倾斜卡片 */
.qr-tilt-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 180ms ease, filter 220ms ease;
  will-change: transform;
  filter: drop-shadow(0 10px 24px rgb(17 17 17 / 0.2));
}

.qr-tilt-glare {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: 0.8rem;
  background: radial-gradient(
    170px circle at var(--glare-x) var(--glare-y),
    rgb(255 255 255 / calc(0.45 * var(--glare-opacity))),
    rgb(255 255 255 / calc(0.12 * var(--glare-opacity))) 38%,
    transparent 72%
  );
  transition: opacity 180ms ease;
}

.contact-markdown {
  overflow: visible;
}

@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
  .qr-tilt-card {
    transform: none !important;
    transition: none;
    filter: none;
  }

  .qr-tilt-glare {
    display: none;
  }
}
</style>
