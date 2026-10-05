<!--
 * [INPUT]: 依赖值日配置和共享 dutySchedule 排班模型
 * [OUTPUT]: 对外提供内部值日表页面组件
 * [POS]: 内部工具路由的独立数据展示页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template>
  <AppLayout>
    <section class="mx-auto flex w-full max-w-360 flex-col gap-10 px-14 pt-24 pb-20 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-12">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.9fr)]">
        <div class="rounded-md border border-black/8 bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(0,0,0,0.03))] p-8 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(251,146,60,0.18),rgba(255,255,255,0.04))]">
          <div class="text-sm text-secondary">{{ roster.subtitle }}</div>
          <h1 class="mt-3 text-4xl font-medium tracking-[-0.04em] text-primary max-md:text-3xl">
            每日倒垃圾排班
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-primary/78">
            {{ roster.routeHint }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3 text-sm text-primary/76">
            <span class="rounded-full bg-black/5 px-4 py-2 dark:bg-white/8">
              轮值开始：{{ rotationStartLabel }}
            </span>
            <span class="rounded-full bg-black/5 px-4 py-2 dark:bg-white/8">
              默认工作日轮值，兼容调休与假期
            </span>
            <span class="rounded-full bg-black/5 px-4 py-2 dark:bg-white/8">
              当前成员 {{ roster.members.length }} 人
            </span>
          </div>
        </div>

        <aside class="grid gap-4">
          <article class="rounded-md border border-black/8 bg-black/3 p-6 dark:border-white/10 dark:bg-white/5">
            <div class="text-sm text-secondary">今天</div>
            <div class="mt-3 text-2xl font-medium text-primary">{{ todayDuty.assignee }}</div>
            <div class="mt-2 text-sm text-secondary">{{ todayDuty.label }}</div>
          </article>
          <article class="rounded-md border border-black/8 bg-black/3 p-6 dark:border-white/10 dark:bg-white/5">
            <div class="text-sm text-secondary">明天</div>
            <div class="mt-3 text-2xl font-medium text-primary">{{ tomorrowDuty.assignee }}</div>
            <div class="mt-2 text-sm text-secondary">{{ tomorrowDuty.label }}</div>
          </article>
          <article class="rounded-md border border-black/8 bg-black/3 p-6 dark:border-white/10 dark:bg-white/5">
            <div class="text-sm text-secondary">维护说明</div>
            <ul class="mt-3 space-y-2 text-sm leading-6 text-primary/78">
              <li v-for="note in roster.notes" :key="note">{{ note }}</li>
            </ul>
          </article>
        </aside>
      </div>

      <section class="overflow-hidden rounded-md border border-black/8 bg-surface dark:border-white/10">
        <div class="border-b border-black/8 px-6 py-5 dark:border-white/10">
          <h2 class="text-xl font-medium text-primary">未来 14 天排班</h2>
          <p class="mt-1 text-sm text-secondary">仅显示今天起未来两周，年度日历优先决定是否排班，特殊日期可手动覆盖负责人。</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full border-separate border-spacing-0">
            <thead>
              <tr class="bg-black/3 text-left text-xs tracking-[0.08em] text-secondary uppercase dark:bg-white/4">
                <th class="px-6 py-3 font-medium">日期</th>
                <th class="px-6 py-3 font-medium">星期</th>
                <th class="px-6 py-3 font-medium">负责人</th>
                <th class="px-6 py-3 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in upcomingRows"
                :key="row.date"
                :class="[
                  'text-sm text-primary',
                  row.isToday ? 'bg-orange-50 dark:bg-orange-500/10' : '',
                  row.isSkipped ? 'opacity-55' : '',
                ]"
              >
                <td class="border-t border-black/6 px-6 py-4 dark:border-white/8">{{ row.displayDate }}</td>
                <td class="border-t border-black/6 px-6 py-4 dark:border-white/8">{{ row.weekdayLabel }}</td>
                <td class="border-t border-black/6 px-6 py-4 dark:border-white/8">
                  <span v-if="row.assignee">{{ row.assignee }}</span>
                  <span v-else class="text-secondary">不排班</span>
                </td>
                <td class="border-t border-black/6 px-6 py-4 text-secondary dark:border-white/8">
                  {{ row.note }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import { dutyRosterConfig as roster } from "../data/internalDutyRoster";
import { createDutySchedule } from "../data/dutySchedule";
const { todayDuty, tomorrowDuty, upcomingRows, rotationStartLabel } = createDutySchedule(roster);
</script>
