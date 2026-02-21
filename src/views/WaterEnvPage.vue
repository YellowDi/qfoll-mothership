<template>
  <AppLayout>
    <div class="w-full bg-bg pt-14 pb-16">
      <WaterEnvHeroSection />

      <section
        v-for="(item, idx) in featureSections"
        :key="item.id"
        :id="item.id"
        class="water-env-section mx-auto w-full max-w-360 px-14 max-lg:px-6 max-md:px-5"
        :class="[
          idx === 0 ? 'mt-12' : 'mt-20 lg:mt-28',
          idx > 0 ? 'content-visibility-auto' : '',
        ]"
      >
        <div
          class="grid grid-cols-1 items-center gap-10 md:grid-cols-5 md:gap-14"
        >
          <div
            class="order-1 min-w-0 md:col-span-2 md:pl-10 md:pr-4"
            :class="[
              idx % 2 === 1 ? 'md:order-2 md:pl-4 md:pr-10' : 'md:order-1',
            ]"
          >
            <h2 class="text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.03em] text-primary">
              {{ item.title }}
            </h2>
            <p class="mt-5 text-[clamp(0.9375rem,1.05vw,1.0625rem)] leading-[1.75] text-secondary">
              {{ item.desc }}
            </p>
          </div>
          <div
            class="order-2 min-w-0 md:col-span-3"
            :class="[
              idx % 2 === 1 ? 'md:order-1 md:-ml-6' : 'md:order-2 md:-mr-6',
            ]"
          >
            <div class="water-env-media-wrapper relative overflow-visible">
              <div class="water-env-section-media relative overflow-hidden rounded-md bg-surface shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.4)]">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title"
                  class="block h-auto w-full object-cover"
                  loading="lazy"
                  :fetchpriority="idx > 0 ? 'low' : undefined"
                />
              <div
                v-else
                class="flex aspect-video items-center justify-center bg-linear-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20"
              >
                <i :class="[item.icon, 'text-6xl text-sky-400/60 dark:text-sky-500/50']"></i>
              </div>
            </div>
              <div
                v-if="item.image"
                class="water-env-img-mask pointer-events-none absolute inset-y-0 z-10"
                :class="idx % 2 === 1 ? 'water-env-img-mask--left' : 'water-env-img-mask--right'"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import WaterEnvHeroSection from "../components/WaterEnvHeroSection.vue";
import { featureSections } from "../data/waterEnvFeatures";
</script>

<style scoped>
.content-visibility-auto {
  content-visibility: auto;
}

/* 图片边缘渐变遮罩，融入页面背景，延伸覆盖阴影 */
/* 图片在右侧：遮罩右边缘完全融入背景 */
.water-env-img-mask--right {
  left: 0;
  right: -72px;
  background: linear-gradient(to left, rgb(var(--color-bg) / 1) 0%, rgb(var(--color-bg) / 1) 15%, rgb(var(--color-bg) / 0.95) 22%, rgb(var(--color-bg) / 0.7) 35%, rgb(var(--color-bg) / 0.35) 50%, transparent 75%);
}

/* 图片在左侧：遮罩左边缘完全融入背景 */
.water-env-img-mask--left {
  left: -72px;
  right: 0;
  background: linear-gradient(to right, rgb(var(--color-bg) / 1) 0%, rgb(var(--color-bg) / 1) 15%, rgb(var(--color-bg) / 0.95) 22%, rgb(var(--color-bg) / 0.7) 35%, rgb(var(--color-bg) / 0.35) 50%, transparent 75%);
}
</style>
