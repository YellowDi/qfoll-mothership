<template>
  <AppLayout>
    <section class="changelog-page mx-auto w-full max-w-360 px-14 pt-24 pb-24 max-lg:px-6">
      <div class="changelog-header mb-16">
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),3.5rem)] font-medium tracking-[-0.03em] leading-tight text-primary"
        >
          Changelog
        </h1>
        <!-- <p class="mt-4 max-w-[36em] text-base leading-[1.72] text-secondary">
          基于 Git 提交自动生成的变更记录，按日期与类型分类展示
        </p> -->
      </div>

      <div v-if="entries.length === 0" class="changelog-empty py-16 text-center text-secondary">
        <i class="ri-git-commit-line mb-4 block text-5xl opacity-50" aria-hidden="true"></i>
        <p>暂无更新记录</p>
        <p class="mt-2 text-sm">
          运行 <code class="rounded bg-edge/50 px-2 py-1">pnpm run generate:changelog</code> 生成
        </p>
      </div>

      <div v-else class="changelog-list space-y-12">
        <section v-for="dayGroup in entries" :key="dayGroup.date" class="changelog-day">
          <h2 class="changelog-day-title mb-6 text-lg font-medium text-primary">
            {{ formatDayTitle(dayGroup.date) }}
          </h2>

          <div class="changelog-items space-y-6">
            <article
              v-for="commit in dayGroup.commits"
              :key="commit.hash"
              class="changelog-item grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-2"
            >
              <!-- 标签组：类型在左，scope 与 commit 在右且左对齐 -->
              <span
                class="changelog-type-badge place-self-start shrink-0 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap pt-px"
                :class="typeBadgeClass(commit.typeInfo.color)"
              >
                {{ commit.typeInfo.label }}
              </span>
              <div class="min-w-0">
                <div v-if="scopeTags(commit.scope).length" class="flex flex-wrap items-center gap-2">
                  <span
                    v-for="tag in scopeTags(commit.scope)"
                    :key="tag"
                    class="changelog-scope-tag rounded bg-edge/40 px-2 py-0.5 font-mono text-xs text-secondary"
                  >
                    {{ tag }}
                  </span>
                </div>
                <p
                  class="changelog-message text-[15px] leading-[1.6] text-primary"
                  :class="scopeTags(commit.scope).length ? 'mt-2' : ''"
                >
                  {{ commit.message }}
                </p>
                <p class="mt-2 text-xs text-secondary">
                  {{ commit.author }}
                  <code class="ml-1 opacity-70">{{ commit.hash }}</code>
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import changelogData from "../data/changelog.json";

const entries = changelogData?.entries ?? [];

function formatDayTitle(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y} 年 ${m} 月 ${day} 日`;
}

function scopeTags(scope) {
  if (!scope) return [];
  return scope
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

const typeBadgeClass = (color) => {
  const map = {
    brand: "bg-brand/15 text-brand",
    green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    purple: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    orange: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    secondary: "bg-edge/50 text-secondary",
  };
  return map[color] ?? map.secondary;
};
</script>
