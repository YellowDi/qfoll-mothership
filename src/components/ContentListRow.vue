<!--
 * [INPUT]: 依赖列表项 Props 与 vue-router 链接能力
 * [OUTPUT]: 对外提供列表内容行
 * [POS]: 新闻和项目列表的轻量链接单元
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template>
  <RouterLink
    class="group grid grid-cols-12 gap-6 border-b border-line py-7 transition-colors hover:border-primary/55 hover:text-primary"
    :to="to"
  >
    <div class="col-span-12 text-sm text-secondary max-md:col-span-12 md:col-span-3">
      <div class="text-[15px] font-medium text-primary">{{ primaryMeta }}</div>
      <div class="mt-2 text-sm text-secondary">{{ secondaryMeta }}</div>
    </div>
    <div class="col-span-12 md:col-span-9">
      <div class="text-[17px] font-medium text-primary">{{ title }}</div>
      <div class="mt-2 text-sm text-secondary">{{ lead }}</div>
    </div>
  </RouterLink>
</template>

<script setup>
defineProps({
  to: {
    type: [String, Object],
    default: "/",
  },
  title: {
    type: String,
    default: "",
  },
  lead: {
    type: String,
    default: "",
  },
  primaryMeta: {
    type: String,
    default: "",
  },
  secondaryMeta: {
    type: String,
    default: "",
  },
});
</script>
