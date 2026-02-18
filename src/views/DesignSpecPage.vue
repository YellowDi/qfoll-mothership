<template>
  <AppLayout>
    <section class="mx-auto w-full max-w-360 px-14 pt-24 pb-20 max-lg:px-6">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center text-sm">
          <span class="text-secondary">公司</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          我们如何设计产品 UI
        </h1>
        <p class="text-primary mt-6 text-center text-base leading-[1.8]">
          从人机交互原则出发，构建可长期维护的界面语言
        </p>
      </div>
    </section>

    <article class="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-10 font-sans text-base leading-relaxed text-primary">
        <div class="markdown-body detail-markdown-body" ref="markdownRef">
          <p>
            在企丰科技，产品界面从来不是视觉包装的最后一步，而是产品能力本身的外在表达。我们更关心界面是否降低了理解成本，是否让业务流程更顺畅，是否能够在长期迭代中保持一致与可维护。这些判断标准既来自行业成熟的人机交互方法论，也来自我们在企业级项目中的长期实践。苹果在 Human Interface Guidelines 中提出的 Clarity、Deference 与 Depth，让我们意识到界面的首要任务是帮助用户理解内容，而不是制造视觉存在感；Google 在 Material Design 中强调设计系统与可实现性，则让我们更加坚定 UI 必须与工程实现保持同一套语言。因此我们在设计时首先关注信息结构与交互逻辑，而不是风格表达，优先建立稳定的栅格体系与组件模型，用可复用的设计单元替代一次性的页面视觉，从一开始就让界面具备可扩展能力。
          </p>

          <div class="md-media design-spec-media" data-carousel-id="carousel-design-spec">
            <div class="md-carousel-controls">
              <button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="prev" type="button" aria-label="上一张">
                <i class="ri-arrow-left-line"></i>
              </button>
              <button class="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="next" type="button" aria-label="下一张">
                <i class="ri-arrow-right-line"></i>
              </button>
            </div>
            <div class="md-carousel-track" data-carousel-track="true">
              <div class="md-carousel-card is-landscape">
                <div
                  class="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="0"
                >
                  <img
                    :src="designSpecScreen01"
                    alt="设计规范示意图"
                    class="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="md-item-caption">组件与布局规范示意图</div>
              </div>
              <div class="md-carousel-card is-portrait">
                <div
                  class="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="1"
                >
                  <img
                    :src="designSpecScreen02"
                    alt="设计规范示意图"
                    class="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="md-item-caption">组件与布局规范示意图</div>
              </div>
              <div class="md-carousel-card is-portrait">
                <div
                  class="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="2"
                >
                  <img
                    :src="designSpecScreen03"
                    alt="设计规范示意图"
                    class="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="md-item-caption">组件与布局规范示意图</div>
              </div>
            </div>
          </div>

          <p>
            对于企业软件而言，UI 的生命周期往往会持续多年，如果缺乏统一规范，随着功能增长界面必然迅速失控。因此我们在设计阶段就同步构建设计系统，通过统一的间距节奏、字号体系、色彩语义、组件结构与状态规则，保证不同模块在持续演进过程中仍然保持一致体验。这种方式带来的价值不仅是视觉层面的统一，更是研发效率与产品稳定性的提升：新功能可以直接接入既有组件体系，前端实现不需要重复造轮子，产品在多次版本迭代后依然保持清晰的结构。我们很少做纯视觉改版，因为真正的升级来自设计系统本身的演进，而不是界面表层的变化。
          </p>

          <p>
            我们所服务的大多数产品属于管理系统、数据平台与业务工具，这类软件的核心不在于展示情绪，而在于高效传递信息。因此在界面决策中我们始终坚持信息优先于风格：先保证信息密度与可读性，再讨论视觉表现；先保证操作路径清晰，再优化动效与氛围；先确保真实业务场景可用，再考虑展示层面的设计感。视觉语言的存在是为了帮助用户理解系统，而不是让界面本身成为关注焦点。当用户能够凭借经验完成新的任务，而不需要重新学习界面时，这套 UI 才真正建立起了价值。
          </p>

          <div class="md-media design-spec-media" data-carousel-id="carousel-design-spec">
            <div class="md-carousel-track" data-carousel-track="true">
              <div class="md-carousel-card is-landscape">
                <div
                  class="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="0"
                >
                  <img
                    :src="designSpecMisans"
                    alt="小米发布的 MiSans 字体，可以免费使用"
                    class="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="md-item-caption">小米发布的 MiSans 字体，可以免费使用</div>
              </div>
            </div>
          </div>

          <p>
            在字体选择上，我们同样遵循系统化与工程化的思路。MiSans 并不是一个单纯的视觉偏好，而是一项基础设施层面的决定。作为为屏幕阅读优化的现代中文字体，它在不同字号下都具备稳定的识别度与清晰的字面结构，能够支撑长时间的数据阅读场景；完整且过渡自然的字重体系，让信息层级可以通过字体本身建立，而不需要依赖额外装饰；在中英文与数字混排频繁出现的企业界面中，它的节奏统一且克制，能够保持整体版面的秩序感。同时，MiSans 的开源属性使我们在保证设计品质的前提下不增加商业授权成本，并且可以通过本地化或 CDN 策略控制加载性能。这使它在设计标准与工程现实之间取得了良好的平衡。
          </p>

          <p>
            我们始终认为一致性高于所谓的设计感。单个页面的精致并不能代表系统层面的优秀，真正重要的是同一种操作在不同模块中的行为是否一致，同一类信息是否始终以相同方式呈现，用户是否可以在新的功能中复用既有认知完成操作。当界面不再需要被刻意关注，而是成为用户完成工作的自然媒介时，UI 才达到了理想状态。基于这一点，我们所有的设计方案都会在阶段早期同步考虑前端实现方式，包括组件结构、响应式规则、暗黑模式映射策略以及动效的性能成本，因为设计稿从来不是最终交付物，可运行的界面才是。
          </p>

          <p>
            企业软件不会停留在某一个版本，因此我们在设计之初就会思考未来三到五年的演进路径：当新的业务模块接入时结构是否依然稳定，是否能够自然扩展到多端形态，是否可以承载新的数据模型与交互方式。界面的价值不在上线那一刻，而在多年之后仍然不需要被推翻重做。也正因如此，我们将 UI 视为产品能力的一部分，而不是视觉层面的附属；将设计视为系统构建，而不是风格输出；将规范视为支持长期进化的基础，而不是限制创造力的边界。这些标准与坚持，构成了我们设计每一个产品界面的出发点。
          </p>

          <div class="md-media design-spec-media" data-carousel-id="carousel-design-spec">
            <div class="md-carousel-track" data-carousel-track="true">
              <div class="md-carousel-card is-landscape">
                <div
                  class="md-carousel-item md-carousel-item-video"
                  data-carousel-id="carousel-design-spec"
                  data-index="0"
                >
                  <video
                    class="md-carousel-video"
                    data-inline-video="true"
                    data-video-id="carousel-design-spec-1"
                    data-src="https://video.cdn.queniuqe.com/store_trailers/256878929/movie_max_vp9.webm"
                    muted
                    playsinline
                    preload="none"
                  ></video>
                </div>
                <div class="md-item-caption">交互流程演示视频</div>
              </div>
            </div>
          </div>

        </div>
      </article>
  </AppLayout>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import { initInlineVideoPlayers } from "../composables/useInlineVideoPlayers";
import "../styles/markdown-media.css";
import designSpecScreen01 from "../assets/design-images/screen-01.webp";
import designSpecScreen02 from "../assets/design-images/test-1.png";
import designSpecScreen03 from "../assets/design-images/test-2.png";
import designSpecMisans from "../assets/design-images/misans.webp";

const markdownRef = ref(null);
let alignTimer = null;
let alignSettleTimer = null;
let disposeInlineVideoPlayers = null;
let resizeObserver = null;

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
  if (viewportWidth <= 768) return 26;
  if (viewportWidth <= 1024) return 30;
  return 36;
};

const getMediaAvailableWidth = (mediaNode) => {
  const widths = [
    mediaNode.clientWidth,
    mediaNode.parentElement?.clientWidth ?? 0,
    markdownRef.value?.clientWidth ?? 0,
    mediaNode.closest("main")?.clientWidth ?? 0,
  ].filter((value) => Number.isFinite(value) && value > 0);
  if (!widths.length) return 0;
  return Math.min(...widths);
};

const syncDesignSpecLandscapeWidths = () => {
  if (!markdownRef.value) return;
  const mediaNodes = markdownRef.value.querySelectorAll(".design-spec-media");
  const peek = getLandscapePeek();
  mediaNodes.forEach((mediaNode) => {
    const availableWidth = getMediaAvailableWidth(mediaNode);
    if (!availableWidth) return;
    const landscapeWidth = Math.max(
      260,
      Math.min(1103, availableWidth - peek * 2)
    );
    mediaNode.style.setProperty("--design-landscape-card-width", `${landscapeWidth}px`);
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
  syncDesignSpecLandscapeWidths();
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
  const mainNode = markdownRef.value?.closest("main");
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
    syncDesignSpecLandscapeWidths();
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
  if (alignTimer) window.clearTimeout(alignTimer);
  if (alignSettleTimer) window.clearTimeout(alignSettleTimer);
});
</script>

<style scoped>
.design-spec-media {
  --design-landscape-card-width: 1103px;
}

.design-spec-media .md-carousel-item {
  aspect-ratio: auto;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  width: 100%;
  max-width: 100%;
}

.design-spec-media .md-carousel-card {
  width: fit-content;
  max-width: none;
}

.design-spec-media .md-carousel-card.is-landscape {
  width: var(--design-landscape-card-width);
  max-width: none;
}

.design-spec-media .md-carousel-card.is-portrait {
  width: fit-content;
  max-width: 100%;
}

.design-spec-media .md-carousel-image {
  display: block;
  height: auto;
  object-fit: contain;
  border-radius: inherit;
}

.design-spec-media .md-carousel-card.is-landscape .md-carousel-image {
  width: 100%;
  max-width: 100%;
  max-height: none;
}

.design-spec-media .md-carousel-card.is-portrait .md-carousel-item {
  width: fit-content;
}

.design-spec-media .md-carousel-card.is-portrait .md-carousel-image {
  width: auto;
  max-width: 100%;
  max-height: min(78vh, 56rem);
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .markdown-body .md-media {
    width: 100% !important;
    max-width: 100% !important;
    margin: 24px auto !important;
  }
}
</style>
