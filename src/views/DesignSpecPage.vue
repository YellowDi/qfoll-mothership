<template>
  <AppLayout>
    <section class="mx-auto w-full max-w-360 px-14 pt-24 pb-20 max-lg:px-6">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center text-[13px]">
          <span class="text-muted">公司</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          设计规范
        </h1>
        <p class="mt-6 text-center text-base leading-[1.8] text-muted">
          这里整理了项目设计过程中的核心规范，帮助团队统一标准、减少沟通损耗并提升交付一致性。
        </p>
      </div>

    </section>

    <article class="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-10 font-sans text-base leading-relaxed text-ink">
        <div class="markdown-body" ref="markdownRef">
          <p>
            设计规范的目标不是增加流程，而是让设计、研发与交付团队在同一标准下协作。通过统一规则，我们可以在项目推进中保持体验一致、实现稳定，并在后续迭代时持续扩展而不破坏整体风格。
          </p>

          <div class="md-media" data-carousel-id="carousel-design-spec">
            <div class="md-carousel-track" data-carousel-track="true">
              <div class="md-carousel-card">
                <div
                  class="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="0"
                  :style="{ backgroundImage: `url(${designSpecScreen01})` }"
                  role="img"
                  aria-label="设计规范示意图"
                ></div>
                <div class="md-item-caption">组件与布局规范示意图</div>
              </div>
            </div>
          </div>

          <h3>品牌规范</h3>
          <p>用于建立统一视觉基线，确保品牌在不同渠道和终端上的识别一致性。</p>
          <ul>
            <li>品牌色彩体系：定义主色、辅助色、语义色及深浅层级规则。</li>
            <li>Logo 使用规则：明确最小留白、最小尺寸、反白与禁用示例。</li>
            <li>字体与排版标准：约定字号层级、字重体系与行高区间。</li>
          </ul>

          <h3>界面规范</h3>
          <p>聚焦高频页面与交互组件，保证体验连续性并降低重复设计成本。</p>
          <ul>
            <li>页面结构规范：统一首页、列表页、详情页等主要布局逻辑。</li>
            <li>组件与状态规范：统一输入、筛选、反馈、异常状态与边界场景。</li>
            <li>图标与插图规范：统一风格、线宽、尺寸和使用优先级。</li>
          </ul>

          <h3>运营视觉规范</h3>
          <p>用于活动推广和内容发布场景，保证不同渠道物料的统一表达。</p>
          <ul>
            <li>海报规范：统一标题层级、信息密度、视觉重心和导出标准。</li>
            <li>社媒封面规范：统一各平台尺寸、版式安全区与信息区域规则。</li>
            <li>演示文稿规范：统一汇报结构、版式节奏和图表展示方式。</li>
          </ul>

          <h3>协作与交付规范</h3>
          <ul>
            <li>规范仅用于项目合作与内部交付，请勿二次分发。</li>
            <li>提交设计稿时需附带字体授权说明与素材来源信息。</li>
            <li>新增组件或页面时需同步补充规范说明，确保后续可复用。</li>
          </ul>

        </div>
      </article>
  </AppLayout>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import designSpecScreen01 from "../assets/design-images/screen-01.webp";

const markdownRef = ref(null);
let alignTimer = null;

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

const scheduleAlign = () => {
  requestAnimationFrame(() => {
    alignMarkdownCarousels();
    if (alignTimer) window.clearTimeout(alignTimer);
    alignTimer = window.setTimeout(() => {
      alignMarkdownCarousels();
    }, 80);
  });
};

onMounted(() => {
  if (markdownRef.value) {
    markdownRef.value.addEventListener("click", handleMarkdownClick, true);
    scheduleAlign();
  }
  window.addEventListener("resize", alignMarkdownCarousels);
  window.addEventListener("orientationchange", scheduleAlign);
});

onUnmounted(() => {
  if (markdownRef.value) {
    markdownRef.value.removeEventListener("click", handleMarkdownClick, true);
  }
  window.removeEventListener("resize", alignMarkdownCarousels);
  window.removeEventListener("orientationchange", scheduleAlign);
  if (alignTimer) window.clearTimeout(alignTimer);
});
</script>
