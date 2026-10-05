/**
 * [INPUT]: 依赖内部值日配置和共享 dutySchedule 排班模型
 * [OUTPUT]: 对外提供 ReactTrashDutyPage，展示今日、明日和未来 14 天排班
 * [POS]: 内部工具路由的 React 页面边界，规则计算下沉到 data 层
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useMemo } from "react";
import { dutyRosterConfig } from "../../data/internalDutyRoster";
import { createDutySchedule } from "../../data/dutySchedule";

export function ReactTrashDutyPage() {
  const schedule = useMemo(() => createDutySchedule(dutyRosterConfig), []);

  return (
    <section className="mx-auto flex w-full max-w-360 flex-col gap-10 px-6 pb-20 pt-20 md:px-14 md:pt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.9fr)]">
        <div className="rounded-md border border-black/8 bg-[linear-gradient(135deg,rgba(251,146,60,.12),rgba(0,0,0,.03))] p-8 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(251,146,60,.18),rgba(255,255,255,.04))]">
          <div className="text-sm text-secondary">{dutyRosterConfig.subtitle}</div>
          <h1 className="mt-3 text-4xl font-medium tracking-[-.04em] max-md:text-3xl">每日倒垃圾排班</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-primary/78">{dutyRosterConfig.routeHint}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-primary/76">
            <span className="rounded-full bg-black/5 px-4 py-2 dark:bg-white/8">
              轮值开始：{schedule.rotationStartLabel}
            </span>
            <span className="rounded-full bg-black/5 px-4 py-2 dark:bg-white/8">
              默认工作日轮值，兼容调休与假期
            </span>
            <span className="rounded-full bg-black/5 px-4 py-2 dark:bg-white/8">
              当前成员 {dutyRosterConfig.members.length} 人
            </span>
          </div>
        </div>

        <aside className="grid gap-4">
          <Summary label="今天" value={schedule.todayDuty.assignee} detail={schedule.todayDuty.label} />
          <Summary label="明天" value={schedule.tomorrowDuty.assignee} detail={schedule.tomorrowDuty.label} />
          <article className="rounded-md border border-black/8 bg-black/3 p-6 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm text-secondary">维护说明</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-primary/78">
              {dutyRosterConfig.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </article>
        </aside>
      </div>

      <section className="overflow-hidden rounded-md border border-black/8 bg-surface dark:border-white/10">
        <div className="border-b border-black/8 px-6 py-5 dark:border-white/10">
          <h2 className="text-xl font-medium">未来 14 天排班</h2>
          <p className="mt-1 text-sm text-secondary">
            仅显示今天起未来两周，年度日历优先决定是否排班，特殊日期可手动覆盖负责人。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-black/3 text-left text-xs uppercase tracking-[.08em] text-secondary dark:bg-white/4">
                <th className="px-6 py-3 font-medium">日期</th>
                <th className="px-6 py-3 font-medium">星期</th>
                <th className="px-6 py-3 font-medium">负责人</th>
                <th className="px-6 py-3 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              {schedule.upcomingRows.map((row) => (
                <tr
                  key={row.date}
                  className={`text-sm ${row.isToday ? "bg-orange-50 dark:bg-orange-500/10" : ""} ${row.isSkipped ? "opacity-55" : ""}`}
                >
                  <td className="border-t border-black/6 px-6 py-4 dark:border-white/8">{row.displayDate}</td>
                  <td className="border-t border-black/6 px-6 py-4 dark:border-white/8">{row.weekdayLabel}</td>
                  <td className="border-t border-black/6 px-6 py-4 dark:border-white/8">
                    {row.assignee || <span className="text-secondary">不排班</span>}
                  </td>
                  <td className="border-t border-black/6 px-6 py-4 text-secondary dark:border-white/8">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-md border border-black/8 bg-black/3 p-6 dark:border-white/10 dark:bg-white/5">
      <div className="text-sm text-secondary">{label}</div>
      <div className="mt-3 text-2xl font-medium">{value}</div>
      <div className="mt-2 text-sm text-secondary">{detail}</div>
    </article>
  );
}
