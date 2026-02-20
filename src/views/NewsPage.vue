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
            role="group"
            aria-label="动态分类"
            @scroll="updateCategoryNavFades"
          >
            <button
              v-for="item in filterTabs"
              :key="item"
              type="button"
              class="shrink-0 transition-colors"
              :class="activeFilter === item ? 'text-primary font-medium' : 'text-secondary hover:text-primary'"
              :aria-pressed="activeFilter === item"
              @click="activeFilter = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-6 text-sm text-secondary">
          <div class="relative">
            <button
              ref="filterToggleRef"
              type="button"
              class="filter-toggle btn-text"
              aria-haspopup="menu"
              :aria-expanded="filterOpen ? 'true' : 'false'"
              :aria-controls="`${filterPanelId} ${mobileFilterPanelId}`"
              aria-label="打开筛选选项"
              @click="filterOpen = !filterOpen; if (filterOpen) sortOpen = false"
            >
              <span class="font-medium text-primary">{{ filterButtonText }}</span>
              <i v-if="filterOpen" class="ri-close-line pointer-events-none text-base" aria-hidden="true"></i>
              <i v-else class="ri-equalizer-2-line pointer-events-none text-base" aria-hidden="true"></i>
            </button>
            <Transition name="dropdown-fade">
              <div
                v-if="filterOpen"
                :id="filterPanelId"
                ref="filterPanelRef"
                class="filter-panel absolute right-0 z-30 mt-3 w-90 rounded-md border border-edge bg-zinc-100 px-6 py-5 text-[15px] text-primary shadow-[0_8px_24px_rgba(17,17,17,0.08)] max-[767px]:hidden dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
                role="region"
                aria-label="动态筛选面板"
                :style="filterDesktopStyle"
              >
                <div class="filter-panel-scroll">
                  <div class="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                    <div>
                      <div class="mb-3 text-sm text-secondary">分类</div>
                      <div class="max-h-55 space-y-2 overflow-auto pr-2">
                        <label
                          v-for="item in tagOptions"
                          :key="item"
                          class="flex items-center gap-3 text-[15px]"
                        >
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-edge bg-transparent text-primary"
                            :value="item"
                            v-model="selectedTags"
                          />
                          <span>{{ item }}</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <div class="mb-3 text-sm text-secondary">年份</div>
                      <div class="max-h-55 space-y-2 overflow-auto pr-2">
                        <label
                          v-for="item in yearOptions"
                          :key="item"
                          class="flex items-center gap-3 text-[15px]"
                        >
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-edge bg-transparent text-primary"
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
                    class="text-[15px] font-medium text-primary"
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
              class="sort-toggle btn-text"
              aria-haspopup="menu"
              :aria-expanded="sortOpen ? 'true' : 'false'"
              :aria-controls="`${sortPanelId} ${mobileSortPanelId}`"
              aria-label="打开排序选项"
              @click="sortOpen = !sortOpen; if (sortOpen) filterOpen = false"
            >
              <span class="font-medium text-primary">排序</span>
              <i :class="sortOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'" class="text-base" aria-hidden="true"></i>
            </button>
            <Transition name="dropdown-fade">
              <div
                v-if="sortOpen"
                :id="sortPanelId"
                ref="sortPanelRef"
                class="sort-panel absolute right-0 z-30 mt-3 w-55 rounded-md border border-edge bg-zinc-100 px-5 py-4 text-[15px] text-primary shadow-[0_8px_24px_rgba(17,17,17,0.08)] max-[767px]:hidden dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
                role="menu"
                aria-label="动态排序"
                :style="sortDesktopStyle"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 py-1.5"
                  role="menuitemradio"
                  :aria-checked="sortMode === '最新'"
                  @click="sortMode = '最新'; sortOpen = false"
                >
                  <span
                    class="flex h-4 w-4 items-center justify-center rounded-full border border-edge"
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
                  role="menuitemradio"
                  :aria-checked="sortMode === '最早'"
                  @click="sortMode = '最早'; sortOpen = false"
                >
                  <span
                    class="flex h-4 w-4 items-center justify-center rounded-full border border-edge"
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
              :class="layout === 'grid' ? 'text-primary' : 'text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary'"
              :aria-pressed="layout === 'grid'"
              aria-label="网格视图"
              @click="layout = 'grid'"
            >
              <i class="ri-grid-fill text-lg" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="p-2.5 transition-colors"
              :class="layout === 'list' ? 'text-primary' : 'text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary'"
              :aria-pressed="layout === 'list'"
              aria-label="列表视图"
              @click="layout = 'list'"
            >
              <i class="ri-list-check-2 text-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="pointer-events-none hidden max-[767px]:absolute max-[767px]:-mx-6 max-[767px]:mt-3 max-[767px]:block max-[767px]:left-0 max-[767px]:right-0 max-[767px]:top-full max-[767px]:z-30">
        <Transition name="dropdown-fade">
          <div
            v-if="filterOpen"
            :id="mobileFilterPanelId"
            ref="mobileFilterPanel"
            class="mobile-filter-panel pointer-events-auto flex flex-col rounded-md border border-edge bg-zinc-100 px-6 py-5 text-[15px] text-primary shadow-sm max-md:shadow-none dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)] dark:max-md:shadow-none"
            role="region"
            aria-label="动态筛选面板（移动端）"
            :style="mobileFilterPanelStyle"
          >
            <div class="min-h-0 flex-1 overflow-y-auto pr-1">
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <div class="mb-3 text-sm text-secondary">分类</div>
                  <div class="space-y-2">
                    <label
                      v-for="item in tagOptions"
                      :key="`m-tag-${item}`"
                      class="flex items-center gap-3 text-[15px]"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-edge bg-transparent text-primary"
                        :value="item"
                        v-model="selectedTags"
                      />
                      <span>{{ item }}</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div class="mb-3 text-sm text-secondary">年份</div>
                  <div class="space-y-2">
                    <label
                      v-for="item in yearOptions"
                      :key="`m-year-${item}`"
                      class="flex items-center gap-3 text-[15px]"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-edge bg-transparent text-primary"
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
            <div class="mt-6 flex justify-end border-t border-line pt-5 pb-1">
              <button
                type="button"
                class="min-h-11 px-2 text-[15px] font-medium text-primary"
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
            :id="mobileSortPanelId"
            class="mobile-sort-panel pointer-events-auto rounded-md border border-edge bg-zinc-100 px-6 py-5 text-[15px] text-primary shadow-sm max-md:shadow-none dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)] dark:max-md:shadow-none"
            role="menu"
            aria-label="动态排序（移动端）"
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 py-1.5"
              role="menuitemradio"
              :aria-checked="sortMode === '最新'"
              @click="sortMode = '最新'; sortOpen = false"
            >
              <span
                class="flex h-4 w-4 items-center justify-center rounded-full border border-edge"
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
              role="menuitemradio"
              :aria-checked="sortMode === '最早'"
              @click="sortMode = '最早'; sortOpen = false"
            >
              <span
                class="flex h-4 w-4 items-center justify-center rounded-full border border-edge"
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
        <ContentGridCard
          v-for="item in filteredNews"
          :key="item.id"
          :to="`/news/${item.id}`"
          :title="item.title"
          :cover="item.cover"
          :cover-src-set="item.coverSrcSet"
          :cover-video="item.coverVideo"
          :cover-icon="item.coverIcon"
          :cover-icon-scale="3"
          cover-media-class="news-cover-media"
          :enable-video-cover="true"
          cover-sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw"
          :primary-meta="item.category"
          :secondary-meta="item.publishedAt"
        />
      </div>

      <div v-else class="mt-8 border-y border-line">
        <ContentListRow
          v-for="item in filteredNews"
          :key="item.id"
          :to="`/news/${item.id}`"
          :title="item.title"
          :lead="item.lead"
          :primary-meta="item.category || '最新动态'"
          :secondary-meta="item.publishedAt"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getAnchoredPanelStyle, isDesktopPanelViewport } from "../composables/anchoredPanel";
import { useFilterSortListPage } from "../composables/useFilterSortListPage";
import ContentGridCard from "../components/ContentGridCard.vue";
import ContentListRow from "../components/ContentListRow.vue";
import { newsList } from "../data/news";
import AppLayout from "../layouts/AppLayout.vue";

const route = useRoute();
const router = useRouter();
const filterPanelId = "news-filter-panel";
const mobileFilterPanelId = "news-filter-panel-mobile";
const sortPanelId = "news-sort-panel";
const mobileSortPanelId = "news-sort-panel-mobile";
const {
  layout,
  sortMode,
  sortOpen,
  filterOpen,
  filterToggleRef,
  filterPanelRef,
  sortToggleRef,
  sortPanelRef,
  filterDesktopStyle,
  sortDesktopStyle,
  filterTabs,
  activeFilter,
  selectedTags,
  selectedYears,
  tagOptions,
  yearOptions,
  categoryNavRef,
  categoryCanScrollLeft,
  categoryCanScrollRight,
  mobileFilterPanel,
  mobileFilterPanelStyle,
  hasActiveFilters,
  filterButtonText,
  updateCategoryNavFades,
  handleFilterAction,
} = useFilterSortListPage({
  route,
  router,
  items: newsList,
  getFilterTag: (item) => item.category,
  getYear: (item) => item.year,
  getAnchoredPanelStyle,
  isDesktopPanelViewport,
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
</script>

<style scoped>
/* 📱 手机默认 */
:deep(.news-cover-media) {
  --cover-icon-scale: 2.6;
}

/* 📲 平板 */
@media (min-width: 768px) {
  :deep(.news-cover-media) {
    --cover-icon-scale: 1.3;
  }
}

/* 🖥 桌面 */
@media (min-width: 1280px) {
  :deep(.news-cover-media) {
    --cover-icon-scale: 2;
  }
}
</style>

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
