/**
 * [INPUT]: 依赖构建生成的 changelog JSON 数据
 * [OUTPUT]: 对外提供 ReactChangelogPage，展示按日期分组的提交记录
 * [POS]: React 工程信息页面，保持 Vue 更新日志的数据来源和视觉结构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import changelogData from "../../data/changelog.json";

type ChangeColor = "brand" | "green" | "purple" | "blue" | "orange" | "secondary";
type ChangeCommit = {
  hash: string;
  message: string;
  author: string;
  scope?: string | null;
  typeInfo: { label: string; color: ChangeColor };
};
type ChangeDay = { date: string; commits: ChangeCommit[] };

const entries = (changelogData?.entries ?? []) as ChangeDay[];
const badgeClass: Record<ChangeColor, string> = {
  brand: "bg-brand/15 text-brand",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  purple: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  orange: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  secondary: "bg-edge/50 text-secondary",
};

function formatDayTitle(date: string) {
  const value = new Date(date);
  return `${value.getFullYear()} 年 ${value.getMonth() + 1} 月 ${value.getDate()} 日`;
}

function scopeTags(scope?: string | null) {
  return scope?.split(/[,、]/).map((item) => item.trim()).filter(Boolean).slice(0, 5) ?? [];
}

export function ReactChangelogPage() {
  return (
    <section className="mx-auto w-full max-w-360 px-6 pb-24 pt-24 md:px-14">
      <div className="mb-16">
        <h1 className="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),3.5rem)] font-medium leading-tight tracking-[-0.03em] text-primary">Changelog</h1>
      </div>
      {entries.length === 0 ? (
        <div className="py-16 text-center text-secondary">
          <i className="ri-git-commit-line mb-4 block text-5xl opacity-50" aria-hidden="true" />
          <p>暂无更新记录</p>
          <p className="mt-2 text-sm">运行 <code className="rounded bg-edge/50 px-2 py-1">pnpm run generate:changelog</code> 生成</p>
        </div>
      ) : (
        <div className="space-y-12">
          {entries.map((day) => (
            <section key={day.date}>
              <h2 className="mb-6 text-lg font-medium text-primary">{formatDayTitle(day.date)}</h2>
              <div className="space-y-6">
                {day.commits.map((commit) => {
                  const tags = scopeTags(commit.scope);
                  return (
                    <article key={commit.hash} className="grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-2">
                      <span className={`place-self-start shrink-0 whitespace-nowrap rounded px-2 py-0.5 pt-px text-xs font-medium ${badgeClass[commit.typeInfo.color] ?? badgeClass.secondary}`}>
                        {commit.typeInfo.label}
                      </span>
                      <div className="min-w-0">
                        {tags.length > 0 && <div className="flex flex-wrap items-center gap-2">{tags.map((tag) => <span key={tag} className="rounded bg-edge/40 px-2 py-0.5 font-mono text-xs text-secondary">{tag}</span>)}</div>}
                        <p className={`text-[15px] leading-[1.6] text-primary ${tags.length ? "mt-2" : ""}`}>{commit.message}</p>
                        <p className="mt-2 text-xs text-secondary">{commit.author}<code className="ml-1 opacity-70">{commit.hash}</code></p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
