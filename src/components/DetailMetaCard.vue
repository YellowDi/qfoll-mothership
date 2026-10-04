<!--
 * [INPUT]: 依赖详情元数据、标签链接和可选 HTML 信息面板
 * [OUTPUT]: 对外提供详情页元信息卡片
 * [POS]: 项目与新闻详情页的侧栏元数据展示组件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template>
  <div class="news-meta-section w-full max-w-360 self-stretch mx-auto py-10">
    <div class="mx-auto w-full px-16 max-xl:px-6 max-md:px-5">
      <div class="news-meta-card bg-zinc-100 px-3 py-6 md:py-10 grid grid-cols-12 rounded-md dark:bg-zinc-800/35">
        <div class="col-span-12 flex flex-col gap-6 md:col-span-6 md:col-start-4">
          <section class="w-full">
            <ul class="news-meta-tags gap-3xs flex flex-wrap">
              <li v-for="tagItem in infoTagLinks" :key="tagItem.label">
                <RouterLink :to="tagItem.to" class="btn-chip">{{ tagItem.label }}</RouterLink>
              </li>
            </ul>
          </section>
          <div v-if="company" class="news-meta-company text-sm leading-[1.8] text-primary">
            {{ company }}
          </div>
          <div
            v-if="infoPanelHtml"
            class="news-info-panel-content info-panel-content text-sm leading-[1.8] text-secondary"
            v-html="infoPanelHtml"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  infoTagLinks: {
    type: Array,
    default: () => [],
  },
  company: {
    type: String,
    default: "",
  },
  infoPanelHtml: {
    type: String,
    default: "",
  },
});
</script>
