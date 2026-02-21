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
          class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14"
        >
          <div
            class="order-1 min-w-0"
            :class="[idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1']"
          >
            <div
              class="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1.5 text-sm text-secondary"
            >
              <i :class="[item.icon, 'text-base']"></i>
              {{ item.chip }}
            </div>
            <h2 class="mt-5 text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.03em] text-primary">
              {{ item.title }}
            </h2>
            <p class="mt-5 text-[clamp(0.9375rem,1.05vw,1.0625rem)] leading-[1.75] text-secondary">
              {{ item.desc }}
            </p>
          </div>
          <div
            class="order-2 min-w-0"
            :class="[idx % 2 === 1 ? 'lg:order-1' : 'lg:order-2']"
          >
            <div class="water-env-section-media overflow-hidden rounded-2xl border border-zinc-200/80 bg-surface shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:border-white/12 dark:shadow-[0_8px_32px_rgba(0,0,0,0.28)]">
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
</style>
