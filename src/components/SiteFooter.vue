<!--
 * [INPUT]: 依赖 vue-router 与站点导航约定
 * [OUTPUT]: 对外提供站点页脚导航和回到顶部行为
 * [POS]: 应用外壳的底部公共区域
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template>
  <footer class="w-full bg-bg/92 backdrop-blur-md">
    <div
      class="relative mx-auto flex w-full max-w-360 items-center justify-end px-14 py-6 text-sm text-secondary max-lg:flex-col max-lg:items-center max-lg:gap-3 max-lg:px-5"
    >
      <div class="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center max-lg:static max-lg:translate-x-0">
        <span class="block lg:inline">© {{ currentYear }} 宁波企丰信息科技有限公司</span>
        <span class="mx-2 text-secondary max-lg:hidden">·</span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
          class="pointer-events-auto block text-secondary transition-colors hover:text-primary max-lg:mt-1 lg:inline"
        >
          浙ICP备2022008031号-1
        </a>
        <span class="mx-2 text-secondary max-lg:hidden">·</span>
      </div>
      <button
        type="button"
        class="btn-neutral btn-neutral-primary gap-1 px-5 max-lg:hidden"
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
