<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-20 max-lg:px-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-4xl font-medium tracking-tight">客户案例</h1>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 text-sm">
        <div class="flex flex-wrap items-center gap-6">
          <button
            v-for="item in filterTabs"
            :key="item"
            type="button"
            class="transition-colors"
            :class="activeFilter === item ? 'text-ink font-semibold' : 'text-muted hover:text-ink'"
            @click="activeFilter = item"
          >
            {{ item }}
          </button>
        </div>

        <div class="flex items-center gap-6 text-sm text-muted">
          <div class="relative">
            <button
              type="button"
              class="filter-toggle flex items-center gap-2 text-muted hover:text-ink transition-colors"
              @click="filterOpen = !filterOpen"
            >
              <span class="font-medium text-ink">筛选</span>
              <i v-if="filterOpen" class="ri-close-line text-base"></i>
              <i v-else class="ri-equalizer-2-line text-base"></i>
            </button>
            <div
              v-if="filterOpen"
              class="filter-panel absolute right-0 mt-3 w-90 rounded-xl border border-line/10 bg-surface px-6 py-5 text-[15px] text-ink shadow-sm dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
            >
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <div class="mb-3 text-sm text-muted">主题</div>
                  <div class="max-h-55 space-y-2 overflow-auto pr-2">
                    <label
                      v-for="item in tagOptions"
                      :key="item"
                      class="flex items-center gap-3 text-[15px]"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-line/35 bg-transparent text-ink"
                        :value="item"
                        v-model="selectedTags"
                      />
                      <span>{{ item }}</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div class="mb-3 text-sm text-muted">年份</div>
                  <div class="max-h-55 space-y-2 overflow-auto pr-2">
                    <label
                      v-for="item in yearOptions"
                      :key="item"
                      class="flex items-center gap-3 text-[15px]"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-line/35 bg-transparent text-ink"
                        :value="item"
                        v-model="selectedYears"
                      />
                      <span>{{ item }} 年</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="mt-5 flex justify-end">
                <button
                  type="button"
                  class="text-[15px] font-medium text-ink"
                  @click="clearFilters"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
          <div class="relative">
            <button
              type="button"
              class="sort-toggle flex items-center gap-2 text-muted hover:text-ink transition-colors"
              @click="sortOpen = !sortOpen"
            >
              <span class="font-medium text-ink">排序</span>
              <i :class="sortOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" class="text-base"></i>
            </button>
            <div
              v-if="sortOpen"
              class="sort-panel absolute right-0 mt-3 w-55 rounded-lg border border-line/10 bg-surface px-5 py-4 text-[15px] text-ink shadow-sm dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
            >
              <button
                type="button"
                class="flex w-full items-center gap-3 py-1.5"
                @click="sortMode = '最新'; sortOpen = false"
              >
                <span
                  class="flex h-4 w-4 items-center justify-center rounded-full border border-line/35"
                >
                  <span
                    v-if="sortMode === '最新'"
                    class="h-2.5 w-2.5 rounded-full bg-ink"
                  ></span>
                </span>
                最新 → 最旧
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-3 py-1.5"
                @click="sortMode = '最早'; sortOpen = false"
              >
                <span
                  class="flex h-4 w-4 items-center justify-center rounded-full border border-line/35"
                >
                  <span
                    v-if="sortMode === '最早'"
                    class="h-2.5 w-2.5 rounded-full bg-ink"
                  ></span>
                </span>
                最旧 → 最新
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="p-2.5 transition-colors"
              :class="layout === 'grid' ? 'text-ink' : 'text-ink/32 hover:text-ink dark:text-ink/35 dark:hover:text-ink'"
              @click="layout = 'grid'"
            >
              <i class="ri-grid-fill text-lg"></i>
            </button>
            <button
              type="button"
              class="p-2.5 transition-colors"
              :class="layout === 'list' ? 'text-ink' : 'text-ink/32 hover:text-ink dark:text-ink/35 dark:hover:text-ink'"
              @click="layout = 'list'"
            >
              <i class="ri-list-check-2 text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="layout === 'grid'" class="mt-8 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
        <RouterLink
          v-for="item in filteredProjects"
          :key="item.id"
          class="group"
          :to="`/project/${item.id}`"
        >
          <div class="overflow-hidden rounded-md">
            <div class="aspect-square w-full rounded-md bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]" :style="{ backgroundImage: item.cover }"></div>
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

      <div v-else class="mt-8 border-y border-line/12">
        <RouterLink
          v-for="item in filteredProjects"
          :key="item.id"
          class="group grid grid-cols-12 gap-6 border-b border-line/12 py-7 transition-colors hover:border-ink/55 hover:text-ink"
          :to="`/project/${item.id}`"
        >
          <div class="col-span-12 text-sm text-muted max-md:col-span-12 md:col-span-3">
            <div class="text-[15px] font-medium text-ink">{{ item.tag || '客户案例' }}</div>
            <div class="mt-2 text-[13px] text-muted">{{ item.year }}</div>
          </div>
          <div class="col-span-12 md:col-span-9">
            <div class="text-[17px] font-medium text-ink">{{ item.title }}</div>
            <div class="mt-2 text-sm text-muted">{{ item.lead }}</div>
          </div>
        </RouterLink>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { projectList } from "../data/projects";
import AppLayout from "../layouts/AppLayout.vue";

const layout = ref("grid");
const sortMode = ref("最新");
const sortOpen = ref(false);
const filterOpen = ref(false);

const filterTabs = computed(() => {
  const tags = projectList
    .map((item) => item.tag)
    .filter(Boolean);
  return ["全部", ...Array.from(new Set(tags))];
});

const activeFilter = ref("全部");
const selectedTags = ref([]);
const selectedYears = ref([]);
const toYearValue = (item) => {
  const year = Number.parseInt(String(item?.year ?? ""), 10);
  return Number.isFinite(year) ? year : -Infinity;
};
const toMonthValue = (item) => {
  const month = Number.parseInt(String(item?.startMonth ?? ""), 10);
  if (!Number.isFinite(month)) return 0;
  return Math.min(12, Math.max(1, month));
};

const tagOptions = computed(() => filterTabs.value.filter((item) => item !== "全部"));
const yearOptions = computed(() => {
  const years = projectList
    .map((item) => Number(item.year))
    .filter((value) => !Number.isNaN(value));
  return Array.from(new Set(years)).sort((a, b) => b - a);
});

const filteredProjects = computed(() => {
  let items = [...projectList];
  if (activeFilter.value !== "全部") {
    items = items.filter((item) => item.tag?.includes(activeFilter.value));
  }
  if (selectedTags.value.length) {
    items = items.filter((item) =>
      selectedTags.value.some((tag) => item.tag?.includes(tag))
    );
  }
  if (selectedYears.value.length) {
    items = items.filter((item) =>
      selectedYears.value.includes(Number(item.year))
    );
  }
  items.sort((a, b) => {
    const aYear = toYearValue(a);
    const bYear = toYearValue(b);
    const aMonth = toMonthValue(a);
    const bMonth = toMonthValue(b);
    if (sortMode.value === "最早") {
      const byYear = aYear - bYear;
      if (byYear !== 0) return byYear;
      const byMonth = aMonth - bMonth;
      if (byMonth !== 0) return byMonth;
      return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
    }
    const byYear = bYear - aYear;
    if (byYear !== 0) return byYear;
    const byMonth = bMonth - aMonth;
    if (byMonth !== 0) return byMonth;
    return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
  });
  return items;
});

const handleDocClick = (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (
    target.closest(".filter-panel") ||
    target.closest(".filter-toggle") ||
    target.closest(".sort-panel") ||
    target.closest(".sort-toggle")
  ) {
    return;
  }
  sortOpen.value = false;
  filterOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", handleDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocClick);
});

const clearFilters = () => {
  selectedTags.value = [];
  selectedYears.value = [];
  filterOpen.value = false;
};
</script>
