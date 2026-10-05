/**
 * [INPUT]: 依赖值日配置和指定日期，使用本地日历日推进轮值
 * [OUTPUT]: 对外提供 createDutySchedule，派生今天、明天和未来 14 天排班
 * [POS]: Vue/React 内部工具页的共享计算边界，节假日先于调休与轮值覆盖
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const displayDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "long",
});

export function createDutySchedule(roster, referenceDate = new Date()) {
const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const today = startOfDay(referenceDate);

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
  return displayDateFormatter.format(date);
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


const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const summary = (date, fallback) => ({ assignee: getDutyAssignee(date).assignee || fallback, label: formatDisplayDate(date) });
return {
  upcomingRows: buildUpcomingRows(),
  todayDuty: summary(today, "今日不排班"),
  tomorrowDuty: summary(tomorrow, "明日不排班"),
  rotationStartLabel: formatDisplayDate(roster.rotationStartDate),
};
}
