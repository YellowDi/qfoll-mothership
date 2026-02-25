<template>
  <header class="fixed left-0 top-0 right-0 z-40 bg-bg/95 backdrop-blur-[2px]">
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
          :class="detailTitleClass"
        >
          {{ detailTitle }}
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
  </header>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { computed } from "vue";
import logoImage from "../assets/logo.webp";
import { useHeaderBarDetailTitle } from "../composables/useHeaderBarDetailTitle";

const { detailTitle, shouldShowDetailTitle } = useHeaderBarDetailTitle();

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

const detailTitleClass = computed(() =>
  [
    "pointer-events-none absolute max-w-[56vw] -translate-x-1/2 truncate text-sm font-medium text-primary max-md:max-w-[48vw] transition-[left,opacity,transform] duration-300 ease-out",
    props.sidebarCollapsed ? "left-1/2" : "left-1/2 md:left-[calc(50%+6.25rem)]",
  ].join(" ")
);
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
</style>
