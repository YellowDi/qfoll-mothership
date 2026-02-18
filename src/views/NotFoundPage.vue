<template>
  <AppLayout>
    <section class="mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-360 flex-col px-14 pt-24 pb-20 max-lg:px-6 max-md:min-h-[calc(100dvh-9.5rem)] max-md:px-5">
      <div class="mx-auto w-full max-w-208 text-center">
        <div class="mb-8 text-sm text-muted">错误 404</div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium"
        >
          页面不存在
        </h1>
        <p class="mx-auto mt-6 max-w-160 text-base leading-[1.8] text-muted">
          你访问的链接可能已失效、地址输入有误，或该内容已被移动。
        </p>
        <div class="mt-8 flex items-center justify-center gap-3 max-md:flex-col">
          <RouterLink
            to="/"
            class="inline-flex h-10 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85"
          >
            返回首页
          </RouterLink>
          <RouterLink
            to="/projects"
            class="inline-flex h-10 items-center justify-center gap-1 rounded-full bg-black/8 px-6 text-sm font-medium text-ink transition-colors hover:bg-black/12 dark:bg-white/14 dark:hover:bg-white/20"
          >
            查看客户案例
            <i class="ri-arrow-right-s-line text-base"></i>
          </RouterLink>
        </div>
      </div>
      <div class="mt-auto h-8 max-md:h-5" aria-hidden="true"></div>
    </section>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
</script>
