<template>
  <section :class="sectionClass">
    <div
      class="relative overflow-hidden select-none water-env-hero-bg flex min-h-[50vh] flex-col justify-start"
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
        <div class="relative grid w-full min-w-0 max-w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
          <div :class="props.homePreview ? 'w-full min-w-0 max-w-full' : 'w-full min-w-0 max-w-full lg:self-start'">
            <div
              class="inline-flex max-w-full items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"
            >
              <i class="ri-drop-line text-sm"></i>
              水质监测 · 数据可视化 · 智能预警
            </div>
            <p class="mt-5 text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-sky-500">
              水环境
            </p>
            <h1 class="mt-1 whitespace-nowrap text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-primary">
              智慧监控平台
            </h1>
            <p class="mt-3 text-[clamp(1.15rem,1.9vw,1.8rem)] leading-tight font-medium text-primary">
              让水域监管更透明、更高效
            </p>
            <p class="text-primary mt-4 w-full min-w-0 max-w-full pr-2 whitespace-normal break-all text-sm leading-relaxed md:pr-0 md:wrap-break-words lg:max-w-136">
              融合物联网、大数据与人工智能技术，实时采集水质指标，构建水域智能监控与预警体系，为环保部门与企业提供全流程数据支撑。
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
  props.homePreview ? "w-full" : "relative mx-auto w-full max-w-360 px-14 pt-8 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-5 max-md:pb-8",
);
</script>

<style scoped>
/* ChatGPT Atlas 风格 mesh gradient，强化 base 底色与渐变层次 */
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
