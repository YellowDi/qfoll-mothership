<template>
  <section
    ref="sectionRef"
    class="about relative mt-0 w-auto overflow-hidden -mx-14 max-lg:-mx-6 max-md:-mx-5"
  >
    <TwinkleDotMatrixBg
      :cell-size="dotConfig.cellSize"
      :dot-size="dotConfig.dotSize"
      :base-opacity="dotConfig.baseOpacity"
      :base-color="dotConfig.baseColor"
      :twinkle-color="dotConfig.twinkleColor"
      :twinkle-intensity="dotConfig.twinkleIntensity"
      :twinkle-rate="dotConfig.twinkleRate"
      :min-duration="dotConfig.minDuration"
      :max-duration="dotConfig.maxDuration"
      :cooldown-min="dotConfig.cooldownMin"
      :cooldown-max="dotConfig.cooldownMax"
      :max-active-twinkles="dotConfig.maxActiveTwinkles"
      :exclude-rects="excludeRects"
    />
    <div class="about-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-1" aria-hidden="true"></div>
    <div class="relative z-2 mx-auto max-w-290 px-14 py-18 pb-16 max-md:px-5 max-md:py-11">
      <div class="about-copy-shell max-w-245 select-none">
        <p
          ref="copyTextRef"
          class="font-medium tracking-[0.2px] text-[42px] leading-[1.22] text-primary max-md:text-[28px] max-md:leading-[1.26]"
        >
          我们是企丰科技
          <img
            class="inline-icon inline-icon--qf mx-1.5 max-md:mx-1.25"
            :src="logoImage"
            :srcset="logoImageSrcSet"
            sizes="(max-width: 768px) 40px, 48px"
            alt="企丰科技"
            loading="lazy"
            decoding="async"
          />
          一家以技术驱动为核心，专注企业信息化系统开发与技术服务的团队。深耕软件研发多年，服务多家企业与品牌
          <span class="inline-flex items-center align-middle overflow-visible mx-1.5 -translate-y-0.5 -space-x-2.5 max-md:mx-1.25 max-md:-space-x-2">
            <img
              class="inline-icon inline-icon--a"
              :src="huasenIcon"
              :srcset="huasenIconSrcSet"
              sizes="(max-width: 768px) 40px, 48px"
              alt="华森"
              loading="lazy"
              decoding="async"
            />
            <img
              class="inline-icon inline-icon--b"
              :src="yunguibaoIcon"
              :srcset="yunguibaoIconSrcSet"
              sizes="(max-width: 768px) 40px, 48px"
              alt="云柜宝"
              loading="lazy"
              decoding="async"
            />
            <img
              class="inline-icon inline-icon--c"
              :src="budongIcon"
              :srcset="budongIconSrcSet"
              sizes="(max-width: 768px) 40px, 48px"
              alt="布咚音乐"
              loading="lazy"
              decoding="async"
            />
          </span>
          。无论是初创企业开拓市场，还是成熟品牌系统升级，我们以创意融合技术，助力商业持续增长。
        </p>
      </div>

      <div
        ref="featuresShellRef"
        class="about-features-shell mt-13 max-w-245"
      >
        <template v-for="item in features" :key="item.title">
          <div class="about-feature-row flex flex-wrap items-baseline gap-3.5 py-4.5">
            <span
              class="whitespace-nowrap text-[19px] font-medium leading-[1.32] text-primary max-md:text-base"
            >
              {{ item.title }}
            </span>
            <span
              class="text-[15px] font-normal leading-[1.64] text-secondary max-md:text-sm"
            >
              {{ item.desc }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import logoImage from "../assets/logo.webp";
import huasenIcon from "../assets/huasen.webp";
import yunguibaoIcon from "../assets/yunguibao.webp";
import budongIcon from "../assets/budong-music.webp";
import logoImageSrcSet from "../assets/logo.webp?w=40;48;64;96&format=webp&as=srcset";
import huasenIconSrcSet from "../assets/huasen.webp?w=40;48;64;96&format=webp&as=srcset";
import yunguibaoIconSrcSet from "../assets/yunguibao.webp?w=40;48;64;96&format=webp&as=srcset";
import budongIconSrcSet from "../assets/budong-music.webp?w=40;48;64;96&format=webp&as=srcset";
import TwinkleDotMatrixBg from "./TwinkleDotMatrixBg.vue";
import { useTheme } from "../composables/useTheme";

const { isDark } = useTheme();
const sectionRef = ref(null);
const copyTextRef = ref(null);
const featuresShellRef = ref(null);
const excludeRects = ref([]);
let shellResizeObserver = null;
let resizeRaf = 0;

const mergeLineRects = (rects, options = {}) => {
  const padX = options.padX ?? 4;
  const padY = options.padY ?? 4;
  const joinGap = options.joinGap ?? 10;
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];

  for (const rect of sorted) {
    const cy = rect.y + rect.height * 0.5;
    const line = lines.find((item) => Math.abs(cy - item.cy) <= Math.max(4, rect.height * 0.55));
    if (!line) {
      lines.push({
        x: rect.x,
        y: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
        cy,
      });
      continue;
    }
    line.x = Math.min(line.x, rect.x);
    line.y = Math.min(line.y, rect.y);
    line.right = Math.max(line.right, rect.x + rect.width);
    line.bottom = Math.max(line.bottom, rect.y + rect.height);
    line.cy = (line.y + line.bottom) * 0.5;
  }

  const expanded = lines
    .map((line) => ({
      x: line.x - padX,
      y: line.y - padY,
      width: line.right - line.x + padX * 2,
      height: line.bottom - line.y + padY * 2,
    }))
    .sort((a, b) => a.y - b.y);

  const bridges = [];
  for (let i = 1; i < expanded.length; i += 1) {
    const prev = expanded[i - 1];
    const next = expanded[i];
    const prevBottom = prev.y + prev.height;
    const gap = next.y - prevBottom;
    if (gap <= 0 || gap > joinGap) continue;
    const x = Math.min(prev.x, next.x);
    const right = Math.max(prev.x + prev.width, next.x + next.width);
    bridges.push({
      x,
      y: prevBottom,
      width: right - x,
      height: gap,
    });
  }
  return [...expanded, ...bridges];
};

const collectTextRects = (element, rootRect) => {
  if (!element || !rootRect) return [];
  const range = document.createRange();
  range.selectNodeContents(element);
  const raw = Array.from(range.getClientRects())
    .map((rect) => ({
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
    }))
    .filter((rect) => rect.width > 1 && rect.height > 1);
  return mergeLineRects(raw, { padX: 5, padY: 4, joinGap: 14 });
};

const scheduleExcludeUpdate = () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    const rootEl = sectionRef.value;
    if (!rootEl) return;
    const rootRect = rootEl.getBoundingClientRect();
    const rects = [];
    rects.push(...collectTextRects(copyTextRef.value, rootRect));
    const featureRows = Array.from(featuresShellRef.value?.querySelectorAll(".about-feature-row") || []);
    for (const row of featureRows) {
      rects.push(...collectTextRects(row, rootRect));
    }
    excludeRects.value = rects;
  });
};

const dotConfig = computed(() => {
  if (isDark.value) {
    return {
      cellSize: 7,
      dotSize: 5,
      baseOpacity: 0.12,
      baseColor: "#52525b",
      twinkleColor: "#fb8a6a",
      twinkleIntensity: 1.02,
      twinkleRate: 0.0054,
      minDuration: 600,
      maxDuration: 1600,
      cooldownMin: 800,
      cooldownMax: 3000,
      maxActiveTwinkles: 96,
    };
  }
  return {
    cellSize: 7,
    dotSize: 5,
    baseOpacity: 0.26,
    baseColor: "#e4e4e7",
    twinkleColor: "#ff6f4f",
    twinkleIntensity: 1.24,
    twinkleRate: 0.0062,
    minDuration: 600,
    maxDuration: 1600,
    cooldownMin: 800,
    cooldownMax: 3000,
    maxActiveTwinkles: 110,
  };
});

const features = [
  {
    title: "战略性设计思维",
    desc: "我们在设计时会考虑到您的商业目标，确保能取得显著成效。",
  },
  {
    title: "协作流程",
    desc: "我们会与您紧密合作，将您的愿景与我们的创意专长相融合。",
  },
  {
    title: "可靠的业绩记录",
    desc: "我们的成功体现在那些感到满意的客户所取得的成就之中。",
  },
  {
    title: "端到端的服务方案",
    desc: "从品牌塑造到产品发布，我们满足您所有的设计需求。",
  },
  {
    title: "创新驱动的方法",
    desc: "我们利用最新的趋势，让您的品牌领先于潮流。",
  },
];

onMounted(() => {
  nextTick(() => {
    scheduleExcludeUpdate();
    shellResizeObserver = new ResizeObserver(() => {
      scheduleExcludeUpdate();
    });
    if (sectionRef.value) shellResizeObserver.observe(sectionRef.value);
    if (copyTextRef.value) shellResizeObserver.observe(copyTextRef.value);
    if (featuresShellRef.value) shellResizeObserver.observe(featuresShellRef.value);
  });
  window.addEventListener("resize", scheduleExcludeUpdate, { passive: true });
});

onBeforeUnmount(() => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = 0;
  shellResizeObserver?.disconnect();
  shellResizeObserver = null;
  window.removeEventListener("resize", scheduleExcludeUpdate);
});
</script>

<style scoped>
.about {
  background: rgb(var(--color-bg) / 1);
}

.about-copy-shell {
  padding: 0.16rem 0.32rem;
}

.about-features-shell {
  padding: 0.08rem 0.32rem;
}

.about-bottom-fade {
  height: 24%;
  background: linear-gradient(
    to bottom,
    rgb(var(--color-bg) / 0) 0%,
    rgb(var(--color-bg) / 0.72) 62%,
    rgb(var(--color-bg) / 1) 100%
  );
}

.inline-icon {
  --icon-rotate: 0deg;
  --icon-scale: 1;
  --icon-y: -4px;
  display: inline-block;
  width: 48px;
  height: 48px;
  margin: 0;
  vertical-align: middle;
  border-radius: 9px;
  border: 2px solid rgba(255, 255, 255, 0.92);
  object-fit: cover;
  transform: translateY(var(--icon-y)) rotate(var(--icon-rotate)) scale(var(--icon-scale));
  transform-origin: center;
  transition: transform 180ms ease-out, box-shadow 180ms ease-out, z-index 180ms ease-out;
  box-shadow: 0 7px 16px rgba(17, 24, 39, 0.24);
}

.inline-icon:hover {
  --icon-scale: 1.2;
  box-shadow: 0 10px 22px rgba(17, 24, 39, 0.3);
  z-index: 5;
}

.inline-icon--qf {
  --icon-rotate: -7deg;
}

.inline-icon--a {
  --icon-rotate: -10deg;
}

.inline-icon--b {
  --icon-rotate: 4deg;
}

.inline-icon--c {
  --icon-rotate: -3deg;
}

@media (max-width: 768px) {
  .inline-icon {
    --icon-y: -2px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }
}
</style>
