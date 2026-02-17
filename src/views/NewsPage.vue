<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-20 max-lg:px-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-4xl font-medium tracking-tight">最新动态</h1>
      </div>

      <div class="relative">
      <div class="flex flex-wrap items-center justify-between gap-4 text-sm">
        <div
          class="category-nav-mask relative min-w-0"
          :class="{
            'has-left-fade': categoryCanScrollLeft,
            'has-right-fade': categoryCanScrollRight,
          }"
        >
          <div
            ref="categoryNavRef"
            class="category-nav-scroll flex items-center gap-6 overflow-x-auto whitespace-nowrap"
            @scroll="updateCategoryNavFades"
          >
            <button
              v-for="item in filterTabs"
              :key="item"
              type="button"
              class="shrink-0 transition-colors"
              :class="activeFilter === item ? 'text-ink font-semibold' : 'text-muted hover:text-ink'"
              @click="activeFilter = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-6 text-sm text-muted">
          <div class="relative">
            <button
              ref="filterToggleRef"
              type="button"
              class="filter-toggle flex items-center gap-2 text-muted hover:text-ink transition-colors"
              @click="filterOpen = !filterOpen; if (filterOpen) sortOpen = false"
            >
              <span class="font-medium text-ink">{{ filterButtonText }}</span>
              <i v-if="filterOpen" class="ri-close-line pointer-events-none text-base"></i>
              <i v-else class="ri-equalizer-2-line pointer-events-none text-base"></i>
            </button>
            <Transition name="dropdown-fade">
              <div
                v-if="filterOpen"
                ref="filterPanelRef"
                class="filter-panel absolute right-0 z-30 mt-3 w-90 rounded-md border border-line/10 bg-zinc-100 px-6 py-5 text-[15px] text-ink shadow-[0_8px_24px_rgba(17,17,17,0.08)] max-md:hidden dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
                :style="filterDesktopStyle"
              >
                <div class="filter-panel-scroll">
                  <div class="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                    <div>
                      <div class="mb-3 text-sm text-muted">分类</div>
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
                </div>
                <div class="filter-panel-footer mt-5 flex justify-end">
                  <button
                    type="button"
                    class="text-[15px] font-medium text-ink"
                    @click="handleFilterAction"
                  >
                    {{ hasActiveFilters ? "清除筛选" : "取消" }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
          <div class="relative">
            <button
              ref="sortToggleRef"
              type="button"
              class="sort-toggle flex items-center gap-2 text-muted hover:text-ink transition-colors"
              @click="sortOpen = !sortOpen; if (sortOpen) filterOpen = false"
            >
              <span class="font-medium text-ink">排序</span>
              <i :class="sortOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" class="text-base"></i>
            </button>
            <Transition name="dropdown-fade">
              <div
                v-if="sortOpen"
                ref="sortPanelRef"
                class="sort-panel absolute right-0 z-30 mt-3 w-55 rounded-md border border-line/10 bg-zinc-100 px-5 py-4 text-[15px] text-ink shadow-[0_8px_24px_rgba(17,17,17,0.08)] max-md:hidden dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
                :style="sortDesktopStyle"
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
            </Transition>
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

      <div class="pointer-events-none hidden max-md:absolute max-md:-mx-6 max-md:mt-3 max-md:block max-md:left-0 max-md:right-0 max-md:top-full max-md:z-30">
        <Transition name="dropdown-fade">
          <div
            v-if="filterOpen"
            ref="mobileFilterPanel"
            class="mobile-filter-panel pointer-events-auto flex flex-col rounded-md border border-line/10 bg-zinc-100 px-6 py-5 text-[15px] text-ink shadow-sm max-md:shadow-none dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)] dark:max-md:shadow-none"
            :style="mobileFilterPanelStyle"
          >
            <div class="min-h-0 flex-1 overflow-y-auto pr-1">
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <div class="mb-3 text-sm text-muted">分类</div>
                  <div class="space-y-2">
                    <label
                      v-for="item in tagOptions"
                      :key="`m-tag-${item}`"
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
                  <div class="space-y-2">
                    <label
                      v-for="item in yearOptions"
                      :key="`m-year-${item}`"
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
            </div>
            <div class="pointer-events-none -mt-10 h-10 bg-gradient-to-b from-transparent to-[#f5f5f5] dark:to-[#222226]"></div>
            <div class="mt-6 flex justify-end border-t border-line/10 pt-5 pb-1">
              <button
                type="button"
                class="min-h-11 px-2 text-[15px] font-medium text-ink"
                @click="handleFilterAction"
              >
                {{ hasActiveFilters ? "清除筛选" : "取消" }}
              </button>
            </div>
          </div>
        </Transition>
        <Transition name="dropdown-fade">
          <div
            v-if="sortOpen"
            class="mobile-sort-panel pointer-events-auto rounded-md border border-line/10 bg-zinc-100 px-6 py-5 text-[15px] text-ink shadow-sm max-md:shadow-none dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)] dark:max-md:shadow-none"
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
        </Transition>
      </div>
      </div>

      <div v-if="layout === 'grid'" class="mt-8 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
        <RouterLink
          v-for="item in filteredNews"
          :key="item.id"
          class="group"
          :to="`/news/${item.id}`"
        >
          <div class="overflow-hidden rounded-sm">
            <CoverImage
              class="aspect-square w-full rounded-sm"
              :src="item.cover"
              :alt="item.title"
              image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </div>
          <div class="pt-4 text-left">
            <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
            <div class="mt-4 flex items-center gap-2 text-sm">
              <span class="font-medium text-ink">{{ item.category }}</span>
              <span class="text-muted">{{ item.publishedAt }}</span>
            </div>
          </div>
        </RouterLink>
      </div>

      <div v-else class="mt-8 border-y border-line/12">
        <RouterLink
          v-for="item in filteredNews"
          :key="item.id"
          class="group grid grid-cols-12 gap-6 border-b border-line/12 py-7 transition-colors hover:border-ink/55 hover:text-ink"
          :to="`/news/${item.id}`"
        >
          <div class="col-span-12 text-sm text-muted max-md:col-span-12 md:col-span-3">
            <div class="text-[15px] font-medium text-ink">{{ item.category || '最新动态' }}</div>
            <div class="mt-2 text-[13px] text-muted">{{ item.publishedAt }}</div>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getAnchoredPanelStyle, isDesktopPanelViewport } from "../composables/anchoredPanel";
import CoverImage from "../components/CoverImage.vue";
import { newsList } from "../data/news";
import AppLayout from "../layouts/AppLayout.vue";

const route = useRoute();
const router = useRouter();
const layout = ref("grid");
const sortMode = ref("最新");
const sortOpen = ref(false);
const filterOpen = ref(false);
const filterToggleRef = ref(null);
const filterPanelRef = ref(null);
const sortToggleRef = ref(null);
const sortPanelRef = ref(null);
const filterDesktopStyle = ref({});
const sortDesktopStyle = ref({});

const filterTabs = computed(() => {
  const tags = newsList
    .map((item) => item.category)
    .filter(Boolean);
  return ["全部", ...Array.from(new Set(tags))];
});

const activeFilter = ref("全部");
const selectedTags = ref([]);
const selectedYears = ref([]);
const syncingFromQuery = ref(false);
const categoryNavRef = ref(null);
const categoryCanScrollLeft = ref(false);
const categoryCanScrollRight = ref(false);
const mobileFilterPanel = ref(null);
const mobileFilterHeight = ref(0);
const hasActiveFilters = computed(
  () => selectedTags.value.length > 0 || selectedYears.value.length > 0
);
const filterButtonText = computed(() => {
  const parts = [
    ...selectedTags.value.map((item) => String(item)),
    ...selectedYears.value.map((item) => `${item}年`),
  ];
  if (!parts.length) return "筛选";
  if (parts.length <= 2) return parts.join(" · ");
  return `${parts.slice(0, 2).join(" · ")} +${parts.length - 2}`;
});
const toStringList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value == null) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};
const applyQueryFilters = () => {
  syncingFromQuery.value = true;
  const queryFilter = String(route.query.filter || "全部");
  activeFilter.value = queryFilter;
  selectedTags.value = toStringList(route.query.tags);
  selectedYears.value = toStringList(route.query.years)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  syncingFromQuery.value = false;
};

const tagOptions = computed(() => filterTabs.value.filter((item) => item !== "全部"));
const yearOptions = computed(() => {
  const years = newsList
    .map((item) => Number(item.year))
    .filter((value) => !Number.isNaN(value));
  return Array.from(new Set(years)).sort((a, b) => b - a);
});
const mobileFilterPanelStyle = computed(() => {
  if (!mobileFilterHeight.value) return {};
  return {
    minHeight: `${mobileFilterHeight.value}px`,
    maxHeight: `${mobileFilterHeight.value}px`,
  };
});

const filteredNews = computed(() => {
  let items = [...newsList];
  if (activeFilter.value !== "全部") {
    items = items.filter((item) => item.category?.includes(activeFilter.value));
  }
  if (selectedTags.value.length) {
    items = items.filter((item) =>
      selectedTags.value.some((tag) => item.category?.includes(tag))
    );
  }
  if (selectedYears.value.length) {
    items = items.filter((item) =>
      selectedYears.value.includes(Number(item.year))
    );
  }
  items.sort((a, b) => {
    if (sortMode.value === "最早") {
      const byDate = a.publishedTimestamp - b.publishedTimestamp;
      if (byDate !== 0) return byDate;
      return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
    }
    const byDate = b.publishedTimestamp - a.publishedTimestamp;
    if (byDate !== 0) return byDate;
    return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
  });
  return items;
});

const handleDocClick = (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (
    target.closest(".filter-panel") ||
    target.closest(".mobile-filter-panel") ||
    target.closest(".filter-toggle") ||
    target.closest(".sort-panel") ||
    target.closest(".mobile-sort-panel") ||
    target.closest(".sort-toggle")
  ) {
    return;
  }
  sortOpen.value = false;
  filterOpen.value = false;
};
const updateCategoryNavFades = () => {
  const el = categoryNavRef.value;
  if (!el) {
    categoryCanScrollLeft.value = false;
    categoryCanScrollRight.value = false;
    return;
  }
  const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  categoryCanScrollLeft.value = el.scrollLeft > 1;
  categoryCanScrollRight.value = el.scrollLeft < maxScrollLeft - 1;
};
const updateDesktopPanelPosition = () => {
  if (!isDesktopPanelViewport()) {
    filterDesktopStyle.value = {};
    sortDesktopStyle.value = {};
    return;
  }
  if (filterOpen.value) {
    filterDesktopStyle.value = getAnchoredPanelStyle({
      triggerEl: filterToggleRef.value,
      panelEl: filterPanelRef.value,
      align: "end",
    });
  }
  if (sortOpen.value) {
    sortDesktopStyle.value = getAnchoredPanelStyle({
      triggerEl: sortToggleRef.value,
      panelEl: sortPanelRef.value,
      align: "end",
    });
  }
};
const updateMobileFilterHeight = () => {
  if (typeof window === "undefined") return;
  if (window.innerWidth > 768) {
    mobileFilterHeight.value = 0;
    return;
  }
  const panel = mobileFilterPanel.value;
  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  const available = Math.floor(window.innerHeight - rect.top);
  mobileFilterHeight.value = Math.max(260, available);
};
const setMobileScrollLock = (locked) => {
  if (typeof window === "undefined") return;
  if (window.innerWidth > 768) return;
  const overflow = locked ? "hidden" : "";
  document.documentElement.style.overflow = overflow;
  document.body.style.overflow = overflow;
};

onMounted(() => {
  applyQueryFilters();
  document.addEventListener("click", handleDocClick);
  window.addEventListener("resize", updateMobileFilterHeight);
  window.addEventListener("resize", updateDesktopPanelPosition);
  window.addEventListener("resize", updateCategoryNavFades);
  window.addEventListener("scroll", updateDesktopPanelPosition, true);
  nextTick(() => {
    updateCategoryNavFades();
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocClick);
  window.removeEventListener("resize", updateMobileFilterHeight);
  window.removeEventListener("resize", updateDesktopPanelPosition);
  window.removeEventListener("resize", updateCategoryNavFades);
  window.removeEventListener("scroll", updateDesktopPanelPosition, true);
  setMobileScrollLock(false);
});

const clearFilters = () => {
  selectedTags.value = [];
  selectedYears.value = [];
  filterOpen.value = false;
};
const handleFilterAction = () => {
  if (hasActiveFilters.value) {
    clearFilters();
    return;
  }
  filterOpen.value = false;
};

watch(
  () => route.query,
  () => {
    applyQueryFilters();
  }
);

watch(
  [activeFilter, selectedTags, selectedYears],
  () => {
    if (syncingFromQuery.value) return;
    const query = {};
    if (activeFilter.value && activeFilter.value !== "全部") query.filter = activeFilter.value;
    if (selectedTags.value.length) query.tags = selectedTags.value.join(",");
    if (selectedYears.value.length) query.years = selectedYears.value.join(",");
    router.replace({ path: route.path, query });
  },
  { deep: true }
);
watch(filterTabs, async () => {
  await nextTick();
  updateCategoryNavFades();
});

watch(filterOpen, async (open) => {
  setMobileScrollLock(open);
  if (!open) {
    filterDesktopStyle.value = {};
    return;
  }
  await nextTick();
  updateMobileFilterHeight();
  updateDesktopPanelPosition();
});

watch(sortOpen, async (open) => {
  if (!open) {
    sortDesktopStyle.value = {};
    return;
  }
  await nextTick();
  updateDesktopPanelPosition();
});
</script>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top right;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.category-nav-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.category-nav-scroll::-webkit-scrollbar {
  display: none;
}

.category-nav-mask::before,
.category-nav-mask::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2.5rem;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.category-nav-mask::before {
  left: 0;
  background: linear-gradient(to right, rgb(var(--color-bg) / 1), rgb(var(--color-bg) / 0));
}

.category-nav-mask::after {
  right: 0;
  background: linear-gradient(to left, rgb(var(--color-bg) / 1), rgb(var(--color-bg) / 0));
}

.category-nav-mask.has-left-fade::before {
  opacity: 1;
}

.category-nav-mask.has-right-fade::after {
  opacity: 1;
}

</style>
