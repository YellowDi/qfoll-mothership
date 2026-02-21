<template>
  <section :class="sectionClass">
    <div
      class="relative overflow-hidden select-none water-env-hero-bg flex min-h-[50vh] flex-col justify-start contain-[layout_paint]"
      :class="[
        props.homePreview
          ? 'min-h-0 rounded-md border border-edge p-8 max-md:p-5'
          : 'border-0 rounded-none',
      ]"
    >
      <WaterSurfaceBg class="pointer-events-none absolute inset-0" />
      <div
        v-if="!props.homePreview"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-bg to-transparent"
      />

      <div :class="contentWrapperClass">
        <div class="relative grid w-full min-w-0 max-w-full grid-cols-1 gap-8 xl:grid-cols-2 xl:items-end">
          <div :class="props.homePreview ? 'w-full min-w-0 max-w-full' : 'w-full min-w-0 max-w-full xl:self-start'">
            <div
              class="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-300/50 bg-white/60 px-3 py-1 text-sm text-secondary backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-on-dark"
            >
              <i class="ri-drop-line text-sm text-sky-500 dark:text-on-dark"></i>
              统一数据平台 · 动态预警 · 污染源追溯
            </div>
            <p class="mt-5 text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-sky-500">
              水环境
            </p>
            <h1 class="mt-1 whitespace-nowrap text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-primary">
              智慧监控平台
            </h1>
            <p class="mt-3 text-[clamp(1.15rem,1.9vw,1.8rem)] leading-tight font-medium text-primary">
              面向排水管网全生命周期管理的数字化监测与预警
            </p>
            <p class="text-primary mt-4 w-full min-w-0 max-w-full pr-2 whitespace-normal break-all text-sm leading-relaxed md:pr-0 md:wrap-break-words xl:max-w-136">
              以统一的数据体系连接分散的监测节点，让排水管网从「看不见」走向「可感知、可分析、可预警」，为水环境治理构建面向长期运行的数字化基础。
            </p>
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <RouterLink
                v-if="props.preview"
                to="/water-env"
                class="btn-primary btn-md gap-2 px-5"
              >
                了解更多
                <i class="ri-arrow-right-line text-base"></i>
              </RouterLink>
            </div>
          </div>

          <div v-if="!props.homePreview" class="w-full min-w-0 xl:self-end">
            <div class="grid grid-cols-3 gap-2 md:gap-3 xl:gap-4">
              <div
                v-for="kpi in kpiItems"
                :key="kpi.label"
                class="kpi-card group relative overflow-hidden rounded-2xl px-3 py-3 transition-all duration-300 md:px-4 md:py-3.5 xl:px-5 xl:py-4"
                :class="kpi.cardClass"
              >
                <!-- 右上光晕 -->
                <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-35" :class="kpi.glow" aria-hidden="true" />
                <div class="absolute right-2 top-2 h-16 w-16 rounded-full opacity-[0.08] blur-xl transition-opacity duration-300 group-hover:opacity-15" :class="kpi.glow" aria-hidden="true" />
                <div class="relative flex flex-col md:flex-row md:items-center md:gap-3 xl:flex-col xl:items-stretch xl:gap-0">
                  <!-- 图标（参考云柜宝智能运力网络卡片） -->
                  <span class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center md:h-11 md:w-11 xl:h-13 xl:w-13">
                    <span class="absolute inset-0 rounded-full blur-[9px] transition-opacity duration-300 group-hover:opacity-0" :class="kpi.iconGlow" aria-hidden="true"></span>
                    <span
                      class="relative inline-flex h-full w-full items-center justify-center rounded-full border border-white/88 bg-white/96 transition-all duration-300 group-hover:border-white/68 group-hover:bg-white/12 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3),inset_0_-8px_14px_rgba(255,255,255,0.12),0_2px_8px_rgba(17,17,17,0.08)] dark:border-white/78 dark:bg-white/90"
                      :class="kpi.iconShadow"
                    >
                      <i :class="[kpi.icon, kpi.iconColor, 'text-lg md:text-xl xl:text-3xl transition-colors duration-300']"></i>
                    </span>
                  </span>
                  <div class="min-w-0 flex flex-col mt-2 md:mt-0 xl:mt-2">
                    <p class="relative text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary/90 dark:text-on-dark/60 md:text-[11px]">{{ kpi.label }}</p>
                    <p class="relative mt-1 font-bold tracking-tight tabular-nums md:mt-1" :class="kpi.valueClass">{{ kpi.value }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import WaterSurfaceBg from "./WaterSurfaceBg.vue";

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
  props.homePreview ? "w-full" : "w-full",
);
const contentWrapperClass = computed(() =>
  props.homePreview ? "w-full" : "relative mx-auto w-full max-w-360 px-14 pt-8 pb-10 max-xl:px-6 max-md:px-5 max-md:pt-5 max-md:pb-8",
);

const kpiItems = [
  {
    label: "监测站点",
    value: "128+",
    icon: "ri-map-pin-fill",
    iconColor: "text-sky-400 transition-colors duration-300 group-hover:text-primary dark:group-hover:text-sky-400",
    iconGlow: "bg-sky-400/30",
    iconShadow: "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.88),inset_0_-10px_18px_rgba(14,165,233,0.16),0_4px_12px_rgba(17,17,17,0.12)]",
    valueClass: "text-base md:text-lg xl:text-[1.35rem] bg-gradient-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent dark:from-sky-400 dark:to-sky-300",
    glow: "bg-sky-500",
    cardClass: "border border-sky-200/50 bg-white/80 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(14,165,233,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-sky-500/20 dark:bg-white/[0.07] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.1] dark:hover:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
  },
  {
    label: "预警响应",
    value: "< 5min",
    icon: "ri-time-line",
    iconColor: "text-cyan-400 transition-colors duration-300 group-hover:text-primary dark:group-hover:text-cyan-400",
    iconGlow: "bg-cyan-400/30",
    iconShadow: "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.88),inset_0_-10px_18px_rgba(6,182,212,0.16),0_4px_12px_rgba(17,17,17,0.12)]",
    valueClass: "text-base md:text-lg xl:text-[1.35rem] bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent dark:from-cyan-400 dark:to-cyan-300",
    glow: "bg-cyan-500",
    cardClass: "border border-cyan-200/50 bg-white/80 shadow-[0_4px_20px_-4px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(6,182,212,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-cyan-500/20 dark:bg-white/[0.07] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.1] dark:hover:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
  },
  {
    label: "运维保障",
    value: "7×24h",
    icon: "ri-shield-check-fill",
    iconColor: "text-indigo-400 transition-colors duration-300 group-hover:text-primary dark:group-hover:text-indigo-400",
    iconGlow: "bg-indigo-400/30",
    iconShadow: "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.88),inset_0_-10px_18px_rgba(99,102,241,0.16),0_4px_12px_rgba(17,17,17,0.12)]",
    valueClass: "text-base md:text-lg xl:text-[1.35rem] bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300",
    glow: "bg-indigo-500",
    cardClass: "border border-indigo-200/50 bg-white/80 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-indigo-500/20 dark:bg-white/[0.07] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.1] dark:hover:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
  },
];
</script>

<style scoped>
/* mesh gradient，强化 base 底色与渐变层次 */
.water-env-hero-bg {
  background:
    radial-gradient(ellipse 90% 70% at 75% 5%, rgba(129, 140, 248, 0.22) 0%, transparent 55%),
    radial-gradient(ellipse 70% 90% at 15% 25%, rgba(59, 130, 246, 0.18) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 88% 55%, rgba(34, 211, 238, 0.14) 0%, transparent 50%),
    radial-gradient(ellipse 55% 70% at 8% 75%, rgba(99, 102, 241, 0.15) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 50% 40%, rgba(147, 197, 253, 0.2) 0%, transparent 50%),
    #d4ebf7;
}

.dark .water-env-hero-bg {
  background:
    radial-gradient(ellipse 90% 70% at 75% 5%, rgba(129, 140, 248, 0.28) 0%, transparent 55%),
    radial-gradient(ellipse 70% 90% at 15% 25%, rgba(59, 130, 246, 0.22) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 88% 55%, rgba(34, 211, 238, 0.16) 0%, transparent 50%),
    radial-gradient(ellipse 55% 70% at 8% 75%, rgba(99, 102, 241, 0.2) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 50% 40%, rgba(96, 165, 250, 0.15) 0%, transparent 50%),
    #0f2847;
}
</style>
