<template>
  <footer class="w-full bg-bg/92 backdrop-blur-md">
    <div
      class="relative mx-auto flex w-full max-w-360 items-center justify-end px-14 py-6 text-sm text-secondary max-lg:px-6 max-md:flex-col max-md:items-center max-md:gap-3 max-md:px-5"
    >
      <div class="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center max-md:static max-md:translate-x-0">
        <span class="block md:inline">© {{ currentYear }} 宁波企丰信息科技有限公司</span>
        <span class="mx-2 text-secondary max-md:hidden">·</span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
          class="pointer-events-auto block text-secondary transition-colors hover:text-primary max-md:mt-1 md:inline"
        >
          浙ICP备2022008031号-1
        </a>
      </div>
      <button
        type="button"
        class="btn-neutral gap-1 px-5 max-md:hidden"
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
