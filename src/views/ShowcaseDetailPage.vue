<template>
  <AppLayout>
    <div v-if="demo">
      <!-- Hero: 左文字右封面，与「公司 - 关于我们」头部布局一致 -->
      <section class="showcase-hero mx-auto w-full max-w-360 px-14 pt-24 pb-16 max-md:pt-20 max-md:pb-10 max-lg:px-6">
        <div class="showcase-hero-grid flex w-full flex-col gap-10 md:flex-row md:items-end md:gap-8 lg:gap-12 xl:gap-x-16">
          <div ref="titleSectionRef" class="showcase-hero-copy order-1 flex min-w-0 flex-col md:flex-1 md:justify-end">
            <div class="mb-5 flex items-center gap-4 text-sm">
              <span class="font-medium text-primary">Showcase</span>
              <span class="text-secondary">{{ demo.type }}</span>
            </div>
            <h1
              class="showcase-hero-title max-w-[28em] text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),3.75rem)] font-medium leading-[1.2] tracking-[-0.03em] text-primary"
            >
              {{ demo.title }}
            </h1>
            <p class="mt-4 text-base leading-[1.72] text-primary/80">
              {{ demo.shortDesc }}
            </p>
            <div v-if="demo.demoUrl || demo.repoUrl" class="mt-8 flex flex-wrap items-center gap-3">
              <a
                v-if="demo.repoUrl"
                :href="demo.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary btn-sm gap-2"
              >
                <i class="ri-github-fill text-sm" aria-hidden="true"></i>
                GitHub
              </a>
              <a
                v-if="demo.demoUrl"
                :href="demo.demoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary btn-sm gap-2"
              >
                访问 Demo
                <i class="ri-arrow-right-line text-sm" aria-hidden="true"></i>
              </a>
            </div>
            <div class="mt-6">
              <button
                class="btn-base relative gap-2 px-2 py-1 text-primary hover:text-secondary"
                type="button"
                aria-label="复制当前页面链接"
                @click="copyShareLink"
              >
                <i class="ri-share-line text-base" aria-hidden="true"></i>
                分享
                <span
                  v-if="copiedVisible"
                  role="status"
                  aria-live="polite"
                  class="absolute left-1/2 top-full z-20 mt-2 inline-flex min-w-21 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-medium leading-none text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                >
                  已复制
                </span>
              </button>
            </div>
          </div>
          <div class="showcase-hero-media order-2 flex justify-center md:flex-1 md:min-w-0 xl:shrink-0 xl:min-w-[560px] xl:max-w-[min(58%,864px)] xl:flex-[1.15]">
            <div class="showcase-hero-image-wrap relative w-full overflow-hidden rounded-2xl bg-[rgb(var(--color-line)/0.08)] aspect-square">
              <CoverImage
                class="h-full w-full"
                image-class="object-center"
                :src="demo.cover"
                :src-set="demo.coverSrcSet"
                :video-src="demo.coverVideo"
                :icon-class="demo.coverIcon"
                :enable-video-cover="false"
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, (min-width: 1440px) 864px, 58vw"
                :alt="`${demo.title} 截图`"
              />
            </div>
          </div>
        </div>
      </section>

      <div class="mx-auto mt-12 w-full max-w-360 px-14 pb-10 max-lg:px-6">
        <div class="mx-auto w-full max-w-[40rem] space-y-8">
          <p class="text-base leading-[1.8] text-primary">
            {{ demo.description }}
          </p>

          <section v-if="demo.coreCapabilities?.length" class="space-y-4">
            <h2 class="text-lg font-medium text-primary">核心能力</h2>
            <ul class="space-y-3">
              <li
                v-for="(cap, i) in demo.coreCapabilities"
                :key="i"
                class="text-base leading-[1.8] text-primary"
              >
                <span class="font-medium">{{ cap.title }}：</span
                ><span class="text-primary/90">{{ cap.desc }}</span>
              </li>
            </ul>
          </section>

          <section v-if="demo.useCases?.length" class="space-y-3">
            <h2 class="text-lg font-medium text-primary">典型使用场景</h2>
            <ul class="list-disc list-inside space-y-1.5 text-base leading-[1.8] text-primary/90">
              <li v-for="(uc, i) in demo.useCases" :key="i">{{ uc }}</li>
            </ul>
          </section>
        </div>

        <!-- 技术栈（与项目/新闻详情页 info 容器样式一致） -->
        <div class="news-meta-section w-full max-w-360 self-stretch mx-auto py-10">
          <div class="mx-auto w-full px-14 max-lg:px-6">
            <div class="news-meta-card bg-zinc-100 px-3 py-6 md:py-10 grid grid-cols-12 rounded-md dark:bg-zinc-800/35">
              <div class="col-span-12 flex flex-col gap-6 md:col-span-6 md:col-start-4">
                <section class="w-full">
                  <h2 class="text-sm font-medium text-secondary mb-3">技术栈</h2>
                  <ul class="news-meta-tags gap-3xs flex flex-wrap">
                    <li v-for="tech in demo.techStack" :key="tech">
                      <span class="btn-chip">{{ tech }}</span>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>

        <RelatedContentSection
          title="更多演示"
          view-all-to="/showcase"
          :items="relatedDemos"
          :item-to="relatedItemTo"
          :primary-meta="relatedPrimaryMeta"
          :secondary-meta="relatedSecondaryMeta"
        />
      </div>
    </div>
    <div v-else class="mx-auto w-full max-w-360 px-14 pt-24 max-lg:px-6">
      <p class="text-secondary">加载中…</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import CoverImage from "../components/CoverImage.vue";
import RelatedContentSection from "../components/RelatedContentSection.vue";
import { useDetailPageInteractions } from "../composables/useDetailPageInteractions";
import { showcaseById, showcaseList } from "../data/showcase";

const route = useRoute();
const router = useRouter();
const titleSectionRef = ref(null);
const demo = computed(() => showcaseById[route.params.id]);

const { copiedVisible, copyShareLink } = useDetailPageInteractions({
  watchSource: demo,
  initInlineVideoPlayers: () => () => {},
});

watch(
  demo,
  (d) => {
    if (!d && route.name === "showcase-detail") {
      router.replace({ name: "showcase" });
    }
  },
  { immediate: true }
);

const relatedDemos = computed(() => {
  const current = demo.value;
  return showcaseList.filter((item) => item.id !== current.id).slice(0, 3);
});

const relatedItemTo = (item) => `/showcase/${item.id}`;
const relatedPrimaryMeta = (item) => item.techStack[0] || item.type;
const relatedSecondaryMeta = (item) => item.type;
</script>

<style scoped>
/* 与「公司 - 关于我们」hero 布局一致：左文右图、底部对齐 */
@media (min-width: 768px) {
  .showcase-hero-grid {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
  }

  .showcase-hero-copy {
    min-height: 0;
    flex: 1;
  }

  .showcase-hero-media {
    flex: 1;
    min-width: 0;
  }
}

@media (min-width: 1280px) {
  .showcase-hero-media {
    flex: 1.15;
    min-width: 560px;
    max-width: min(58%, 864px);
    flex-shrink: 0;
  }
}
</style>
