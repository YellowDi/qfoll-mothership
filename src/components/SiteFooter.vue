<template>
  <footer class="w-full bg-bg/92 backdrop-blur-md">
    <div
      class="relative mx-auto flex w-full max-w-360 items-center justify-end px-14 py-6 text-[13px] text-muted max-lg:px-6 max-md:flex-col max-md:items-center max-md:gap-3 max-md:px-5"
    >
      <div class="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center max-md:static max-md:translate-x-0">
        <span>© {{ currentYear }} 宁波企丰信息科技有限公司</span>
        <span class="mx-2 text-muted/60">·</span>
        <span class="text-muted/70">浙ICP备2022008031号-1</span>
      </div>
      <button
        type="button"
        class="btn-neutral-pill gap-1 px-5"
        @click="scrollToTop"
      >
        返回顶部
        <i class="ri-arrow-up-line text-sm"></i>
      </button>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear();

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
</script>
