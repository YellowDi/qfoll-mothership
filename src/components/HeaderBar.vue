<template>
  <header ref="headerRootRef" class="fixed left-0 top-0 right-0 z-40 bg-bg">
    <div class="relative flex h-14 items-center justify-between px-4 md:px-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="flex items-center gap-2">
          <img :src="logoImage" alt="企丰科技" class="h-8 w-8 rounded-sm object-cover" />
          <div class="text-sm font-medium">企丰科技</div>
        </RouterLink>
        <button
          class="hidden md:inline-flex btn-icon btn-icon-md btn-icon-muted"
          type="button"
          @click="onToggle"
          aria-label="切换侧边导航"
        >
          <i class="ri-layout-left-2-line text-lg" aria-hidden="true"></i>
        </button>
      </div>
      <Transition name="header-detail-title">
        <div
          v-if="shouldShowDetailTitle"
          :class="detailTitleDesktopClass"
        >
          <button
            v-if="hasToc"
            class="inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-black/5 dark:hover:bg-white/8"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="tocOpen ? 'true' : 'false'"
            @click.stop="toggleHeaderBarToc"
          >
            <span class="truncate">{{ detailTitle }}</span>
            <i
              class="ri-arrow-down-s-line text-base transition-transform duration-200"
              :class="{ 'rotate-180': tocOpen }"
              aria-hidden="true"
            ></i>
          </button>
          <div
            v-else
            class="max-w-full truncate px-2 py-1 text-sm font-medium text-primary"
          >
            {{ detailTitle }}
          </div>
          <Transition name="header-detail-toc">
            <div
              v-if="tocOpen && hasToc"
              class="absolute left-1/2 top-full mt-2 max-h-[58vh] w-[min(38rem,72vw)] -translate-x-1/2 overflow-auto rounded-md bg-white p-2 shadow-xs dark:border-white/12 dark:bg-zinc-900"
              role="menu"
              aria-label="文章目录"
            >
              <button
                v-for="item in tocItems"
                :key="item.id"
                class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm"
                :class="itemClass(item)"
                role="menuitem"
                type="button"
                @click="navigateHeaderBarToc(item.id)"
              >
                {{ item.text }}
              </button>
            </div>
          </Transition>
        </div>
      </Transition>
      <div class="flex items-center gap-1">
        <button
          class="inline-flex btn-icon btn-icon-md btn-icon-muted"
          type="button"
          @click="onToggleTheme"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
        >
          <i :class="isDark ? 'ri-sun-line text-lg' : 'ri-moon-clear-line text-lg'" aria-hidden="true"></i>
        </button>
        <button
          class="inline-flex btn-icon btn-icon-md btn-icon-muted md:hidden"
          type="button"
          @click="onToggle"
          aria-label="切换侧边导航"
        >
          <i class="ri-layout-left-2-line text-lg" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <Transition name="header-detail-title">
      <div
        v-if="shouldShowDetailTitle"
        class="relative px-3 py-1.5 md:hidden"
      >
        <button
          v-if="hasToc"
          class="inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="tocOpen ? 'true' : 'false'"
          @click.stop="toggleHeaderBarToc"
        >
          <span class="truncate">{{ detailTitle }}</span>
          <i
            class="ri-arrow-down-s-line text-base transition-transform duration-200"
            :class="{ 'rotate-180': tocOpen }"
            aria-hidden="true"
          ></i>
        </button>
        <div
          v-else
          class="truncate px-2 py-1 text-center text-sm font-medium text-primary"
        >
          {{ detailTitle }}
        </div>
        <Transition name="header-detail-toc">
          <div
            v-if="tocOpen && hasToc"
            class="absolute left-0 right-0 top-full max-h-[58vh] w-screen overflow-auto border-b border-black/8 bg-bg p-2 shadow-xs dark:border-white/12"
            role="menu"
            aria-label="文章目录"
          >
            <button
              v-for="item in tocItems"
              :key="item.id"
              class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors"
              :class="itemClass(item)"
              role="menuitem"
              type="button"
              @click="navigateHeaderBarToc(item.id)"
            >
              {{ item.text }}
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import logoImage from "../assets/logo.webp";
import {
  closeHeaderBarToc,
  navigateHeaderBarToc,
  toggleHeaderBarToc,
  useHeaderBarDetailTitle,
} from "../composables/useHeaderBarDetailTitle";

const {
  detailTitle,
  shouldShowDetailTitle,
  tocItems,
  activeTocId,
  tocOpen,
} = useHeaderBarDetailTitle();
const headerRootRef = ref(null);

const props = defineProps({
  onToggle: {
    type: Function,
    required: true,
  },
  onToggleTheme: {
    type: Function,
    required: true,
  },
  isDark: {
    type: Boolean,
    required: true,
  },
  sidebarCollapsed: {
    type: Boolean,
    required: true,
  },
});

const detailTitleDesktopClass = computed(() =>
  [
    "absolute hidden text-sm text-primary transition-[left,opacity,transform] duration-300 ease-out md:flex md:items-center",
    props.sidebarCollapsed
      ? "left-1/2 -translate-x-1/2 max-w-[56vw]"
      : "left-1/2 md:left-[calc(50%+6.25rem)] -translate-x-1/2 max-w-[56vw]",
  ].join(" ")
);

const hasToc = computed(() => tocItems.value.length > 0);

const itemClass = (item) => {
  const active = item.id === activeTocId.value;
  const levelClass = item.level >= 3 ? "pl-8" : "pl-3";
  return [
    levelClass,
    active
      ? "bg-black/8 text-primary dark:bg-white/12"
      : "text-primary hover:bg-black/5 dark:hover:bg-white/8",
  ].join(" ");
};

const handleDocumentPointerDown = (event) => {
  if (!tocOpen.value) return;
  const root = headerRootRef.value;
  const target = event.target;
  if (root instanceof HTMLElement && target instanceof Node && !root.contains(target)) {
    closeHeaderBarToc();
  }
};

const handleDocumentKeydown = (event) => {
  if (event.key === "Escape") {
    closeHeaderBarToc();
  }
};

watch(shouldShowDetailTitle, (show) => {
  if (!show) closeHeaderBarToc();
});

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.removeEventListener("keydown", handleDocumentKeydown);
});
</script>

<style scoped>
.header-detail-title-enter-active,
.header-detail-title-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.header-detail-title-enter-from {
  opacity: 0;
  --tw-translate-y: -4px;
}

.header-detail-title-enter-to,
.header-detail-title-leave-from {
  --tw-translate-y: 0px;
}

.header-detail-title-leave-to {
  opacity: 0;
  --tw-translate-y: -4px;
}

.header-detail-toc-enter-active,
.header-detail-toc-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.header-detail-toc-enter-from {
  --tw-translate-y: -8px;
  opacity: 0;
}

.header-detail-toc-enter-to,
.header-detail-toc-leave-from {
  --tw-translate-y: 0px;
}

.header-detail-toc-leave-to {
  --tw-translate-y: -8px;
  opacity: 0;
}
</style>
