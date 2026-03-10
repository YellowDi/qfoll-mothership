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
              轮值开始：{{ formatDisplayDate(roster.rotationStartDate) }}
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
import { computed } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import { dutyRosterConfig as roster } from "../data/internalDutyRoster";

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const today = startOfDay(new Date());

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseDate(dateString) {
  const [year, month, day] = String(dateString).split("-").map((value) => Number.parseInt(value, 10));
  return new Date(year, month - 1, day);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateLike) {
  const date = typeof dateLike === "string" ? parseDate(dateLike) : dateLike;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function isWeekend(date) {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

const rotationStart = startOfDay(parseDate(roster.rotationStartDate));
const calendarByYear = roster.calendarByYear || {};

function getCalendarForYear(date) {
  return calendarByYear[String(date.getFullYear())] || null;
}

function isListedDate(dateList, date) {
  return Array.isArray(dateList) && dateList.includes(formatDateKey(date));
}

function getDutyDayStatus(date) {
  const calendar = getCalendarForYear(date);

  if (calendar && isListedDate(calendar.offDays, date)) {
    return "holiday";
  }

  if (calendar && isListedDate(calendar.workdays, date)) {
    return "makeup-workday";
  }

  return isWeekend(date) ? "weekend" : "workday";
}

function isDutyDay(date) {
  const status = getDutyDayStatus(date);
  return status === "workday" || status === "makeup-workday";
}

function getRowNote(source, status) {
  if (source === "override") return "手动调整";
  if (status === "makeup-workday") return "调休上班";
  if (status === "holiday") return "假期休息";
  if (status === "weekend") return "周末休息";
  return "常规轮值";
}

function getDutyAssignee(date) {
  const normalizedDate = startOfDay(date);
  const dayStatus = getDutyDayStatus(normalizedDate);
  if (!isDutyDay(normalizedDate)) {
    return { assignee: "", source: "skipped", dayStatus };
  }

  let workingDays = 0;
  const cursor = new Date(rotationStart);
  while (cursor < normalizedDate) {
    if (isDutyDay(cursor)) {
      workingDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const override = roster.overrides[formatDateKey(normalizedDate)];
  if (override) {
    return { assignee: override, source: "override", dayStatus };
  }

  const index = workingDays % roster.members.length;
  return { assignee: roster.members[index], source: "rotation", dayStatus };
}

function buildUpcomingRows() {
  const rows = [];
  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const duty = getDutyAssignee(date);
    rows.push({
      date: formatDateKey(date),
      displayDate: `${date.getMonth() + 1} 月 ${date.getDate()} 日`,
      weekdayLabel: weekdayLabels[date.getDay()],
      assignee: duty.assignee,
      isSkipped: duty.source === "skipped",
      isToday: formatDateKey(date) === formatDateKey(today),
      note: getRowNote(duty.source, duty.dayStatus),
    });
  }
  return rows;
}

const upcomingRows = computed(() => buildUpcomingRows());

const todayDuty = computed(() => {
  const duty = getDutyAssignee(today);
  return {
    assignee: duty.assignee || "今日不排班",
    label: formatDisplayDate(today),
  };
});

const tomorrowDuty = computed(() => {
  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);
  const duty = getDutyAssignee(nextDay);
  return {
    assignee: duty.assignee || "明日不排班",
    label: formatDisplayDate(nextDay),
  };
});
</script>
