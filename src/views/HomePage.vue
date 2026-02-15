<template>
  <AppLayout>
    <div class="w-full px-14 pt-14 pb-20 max-lg:px-6 max-md:px-5 max-md:pt-14 max-md:pb-12">
      <AboutSection />

      <div class="mt-16 w-full max-w-360 self-stretch mx-auto">
        <div class="mx-auto flex w-full items-center justify-between">
          <h3 class="text-lg font-medium">客户案例</h3>
          <RouterLink class="text-[13px] text-muted transition-colors hover:text-ink" to="/projects">查看全部</RouterLink>
        </div>
        <div class="mx-auto w-full pb-10 pt-6 max-md:pb-8">
          <div class="grid grid-cols-12 gap-6 max-md:gap-4">
            <div class="col-span-8 self-start max-lg:col-span-12 lg:sticky lg:top-17">
              <div
                class="cursor-pointer rounded-md"
                role="link"
                tabindex="0"
                @click="goYgb"
                @keydown.enter.prevent="goYgb"
                @keydown.space.prevent="goYgb"
              >
                <YgbHeroSection preview home-preview />
              </div>
            </div>

            <div class="col-span-4 flex flex-col gap-6 max-lg:col-span-12 max-md:hidden">
              <RouterLink
                v-for="item in sideProjects"
                :key="item.id"
                class="group block"
                :to="`/project/${item.id}`"
              >
                <div class="overflow-hidden rounded-md">
                  <div
                    class="aspect-square w-full rounded-md bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    :style="{ backgroundImage: item.cover }"
                  ></div>
                </div>
                <div class="pt-3 text-left">
                  <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
                  <div class="mt-4 flex items-center gap-2 text-sm">
                    <span class="font-medium text-ink">{{ item.tag }}</span>
                    <span class="text-muted">{{ item.year }}</span>
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
                <div class="h-full w-full rounded-md bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]" :style="{ backgroundImage: item.cover }"></div>
              </div>
              <div class="pt-4 text-left">
                <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
                <div class="mt-4 flex items-center gap-2 text-sm">
                  <span class="font-medium text-ink">{{ item.tag }}</span>
                  <span class="text-muted">{{ item.year }}</span>
                </div>
              </div>
            </RouterLink>
          </div>

          <div v-if="moreProjects.length" class="mt-10 max-md:hidden">
            <div class="grid grid-cols-3 gap-6">
              <RouterLink
                v-for="item in moreProjects"
                :key="`more-${item.id}`"
                class="group block"
                :to="`/project/${item.id}`"
              >
                <div class="overflow-hidden rounded-md">
                  <div
                    class="aspect-square w-full rounded-md bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    :style="{ backgroundImage: item.cover }"
                  ></div>
                </div>
                <div class="pt-3 text-left">
                  <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
                  <div class="mt-4 flex items-center gap-2 text-sm">
                    <span class="font-medium text-ink">{{ item.tag }}</span>
                    <span class="text-muted">{{ item.year }}</span>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>

          <div v-if="hasMoreProjects" class="mt-8 flex justify-center max-md:mt-6">
            <RouterLink
              to="/projects"
              class="inline-flex h-10 items-center justify-center rounded-full bg-zinc-100 px-8 text-sm font-medium tracking-[-0.005em] text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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
import TagMarqueeSection from "../components/TagMarqueeSection.vue";
import YgbHeroSection from "../components/YgbHeroSection.vue";
import { computed } from "vue";
import { projectList } from "../data/projects";
import { useRouter } from "vue-router";

const router = useRouter();
const goYgb = () => router.push("/ygb");

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
const moreProjects = computed(() => moreProjectPool.value.slice(0, 3));
const hasMoreProjects = computed(() => moreProjectPool.value.length > 3);
</script>
