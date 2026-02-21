<template>
  <AppLayout>
    <div class="w-full px-14 pt-14 pb-20 max-lg:px-6 max-md:px-5 max-md:pt-14 max-md:pb-12">
      <h1 class="sr-only">企丰科技</h1>
      <AboutSection />

      <div class="mt-16 w-full max-w-360 self-stretch mx-auto">
        <div class="mx-auto flex w-full items-center justify-between">
          <h2 class="text-lg font-medium">客户案例</h2>
          <RouterLink class="text-sm btn-text" to="/projects">查看全部</RouterLink>
        </div>
        <div class="mx-auto w-full pb-10 pt-6 max-md:pb-8">
          <div class="grid grid-cols-12 gap-6 max-md:gap-4">
            <div class="col-span-12 self-start max-[1279px]:col-span-12 min-[1280px]:col-span-8 min-[1280px]:sticky min-[1280px]:top-17">
              <RouterLink class="cursor-pointer rounded-md" to="/ygb">
                <YgbHeroSection preview home-preview />
              </RouterLink>
            </div>

            <div class="col-span-12 grid grid-cols-3 gap-6 max-[1279px]:col-span-12 max-[1279px]:grid max-[1279px]:grid-cols-3 min-[1280px]:col-span-4 min-[1280px]:flex min-[1280px]:flex-col max-md:hidden">
              <RouterLink
                v-for="item in sideProjects"
                :key="item.id"
                class="group block"
                :to="`/project/${item.id}`"
              >
                <div class="overflow-hidden rounded-md">
                  <CoverImage
                    class="aspect-square w-full rounded-md"
                    :src="item.cover"
                    :src-set="item.coverSrcSet"
                    :video-src="item.coverVideo"
                    :icon-class="item.coverIcon"
                    :enable-video-cover="true"
                    sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw"
                    :alt="item.title"
                    image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div class="pt-3 text-left">
                  <div class="text-xl leading-[1.3] font-medium text-primary max-md:text-lg">{{ item.title }}</div>
                  <div class="mt-4 flex items-center gap-2 text-sm">
                    <span class="font-medium text-primary">{{ item.tag }}</span>
                    <span class="text-secondary">{{ item.yearLabel || item.year }}</span>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>

          <div class="mt-4 hidden grid-cols-1 gap-6 max-md:grid">
            <RouterLink
              v-for="item in sideProjects"
              :key="`mobile-side-${item.id}`"
              class="group block"
              :to="`/project/${item.id}`"
            >
              <div class="aspect-square w-full overflow-hidden rounded-md">
                <CoverImage
                  class="h-full w-full rounded-md"
                  :src="item.cover"
                  :src-set="item.coverSrcSet"
                  :video-src="item.coverVideo"
                  :icon-class="item.coverIcon"
                  :enable-video-cover="true"
                  sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw"
                  :alt="item.title"
                  image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div class="pt-4 text-left">
                <div class="text-xl leading-[1.3] font-medium text-primary max-md:text-lg">{{ item.title }}</div>
                <div class="mt-4 flex items-center gap-2 text-sm">
                  <span class="font-medium text-primary">{{ item.tag }}</span>
                  <span class="text-secondary">{{ item.yearLabel || item.year }}</span>
                </div>
              </div>
            </RouterLink>
          </div>

          <div v-if="hasMoreProjects" class="mt-16 flex justify-center max-md:mt-6">
            <RouterLink
              to="/projects"
              class="btn-neutral btn-neutral-primary"
            >
              查看更多
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="mt-16 w-full max-w-360 self-stretch mx-auto">
        <div class="mx-auto flex w-full items-center justify-between">
          <h2 class="text-lg font-medium">最新动态</h2>
          <RouterLink class="text-sm btn-text btn-text-primary" to="/news">查看更多</RouterLink>
        </div>
        <div class="mx-auto w-full pt-6">
          <div class="grid grid-flow-row grid-cols-1 gap-y-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6 xl:gap-x-10 xl:gap-y-8">
            <RouterLink
              v-for="item in latestNews"
              :key="`news-${item.id}`"
              class="group grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-2 lg:grid-cols-[minmax(0,12rem)_1fr] lg:gap-4"
              :to="`/news/${item.id}`"
            >
              <div class="overflow-hidden rounded-md">
                <CoverImage
                  class="aspect-square w-full rounded-md"
                  :src="item.cover"
                  :src-set="item.coverSrcSet"
                  :video-src="item.coverVideo"
                  :icon-class="item.coverIcon"
                  :enable-video-cover="true"
                  sizes="(max-width: 1023px) 9rem, 12rem"
                  :alt="item.title"
                  image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div class="flex min-h-full max-w-none flex-col justify-center pl-2 pr-6 py-1.5 text-left lg:max-w-[36rem] lg:pl-4 lg:pr-8 lg:py-2 xl:pr-10">
                <div class="text-base leading-[1.3] font-medium text-primary lg:text-lg">{{ item.title }}</div>
                <div class="mt-4 flex items-center gap-2 text-sm">
                  <span class="font-medium text-primary">{{ item.category }}</span>
                  <span class="text-secondary">{{ item.publishedAt }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
          <div class="mt-6 flex justify-center xl:mt-16">
            <RouterLink
              to="/news"
              class="btn-neutral btn-neutral-primary"
            >
              查看更多
            </RouterLink>
          </div>
        </div>
      </div>

      <TagMarqueeSection />

    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import AboutSection from "../components/AboutSection.vue";
import CoverImage from "../components/CoverImage.vue";
import TagMarqueeSection from "../components/TagMarqueeSection.vue";
import YgbHeroSection from "../components/YgbHeroSection.vue";
import { computed } from "vue";
import { projectList } from "../data/projects";
import { newsList } from "../data/news";

const toYearValue = (item) => {
  const year = Number.parseInt(String(item?.year ?? ""), 10);
  return Number.isFinite(year) ? year : -Infinity;
};
const toMonthValue = (item) => {
  const month = Number.parseInt(String(item?.startMonth ?? ""), 10);
  if (!Number.isFinite(month)) return 0;
  return Math.min(12, Math.max(1, month));
};

const sortedProjects = computed(() => {
  return [...projectList]
    .sort((a, b) => {
      const byYear = toYearValue(b) - toYearValue(a);
      if (byYear !== 0) return byYear;
      const byMonth = toMonthValue(b) - toMonthValue(a);
      if (byMonth !== 0) return byMonth;
      return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
    });
});

const sideProjects = computed(() => sortedProjects.value.filter((item) => item.id !== "ygb").slice(0, 3));
const sideProjectIds = computed(() => new Set(sideProjects.value.map((item) => item.id)));
const moreProjectPool = computed(() =>
  sortedProjects.value.filter((item) => item.id !== "ygb" && !sideProjectIds.value.has(item.id)),
);
const hasMoreProjects = computed(() => moreProjectPool.value.length > 0);
const latestNews = computed(() =>
  [...newsList]
    .sort((a, b) => b.publishedTimestamp - a.publishedTimestamp)
    .slice(0, 6)
);
</script>
