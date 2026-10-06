/**
 * [INPUT]: 依赖详情标签、公司信息和 Markdown 信息面板
 * [OUTPUT]: 对外提供项目与新闻详情共用的元信息卡片
 * [POS]: 详情页正文之后的内容归属与筛选入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";
import { ReactSanitizedHtml } from "./ReactSanitizedHtml";

type TagLink = { label: string; to: { path: string; query?: Record<string, string> } };
type Props = { infoTagLinks?: TagLink[]; company?: string; infoPanelHtml?: string };

function toHref(to: TagLink["to"]) {
  const query = to.query ? new URLSearchParams(to.query).toString() : "";
  return `${to.path}${query ? `?${query}` : ""}`;
}

export function ReactDetailMetaCard({ infoTagLinks = [], company = "", infoPanelHtml = "" }: Props) {
  if (!infoTagLinks.length && !company && !infoPanelHtml) return null;
  return <div className="mx-auto w-full max-w-360 self-stretch py-10">
    <div className="mx-auto w-full px-6 md:px-16">
      <div className="grid grid-cols-12 rounded-md bg-zinc-100 px-3 py-6 dark:bg-zinc-800/35 md:py-10">
        <div className="col-span-12 flex flex-col gap-6 md:col-span-6 md:col-start-4">
          {infoTagLinks.length > 0 && <ul className="flex flex-wrap gap-2">
            {infoTagLinks.map((tag) => <li key={tag.label}><Link to={toHref(tag.to)} className="btn-chip">{tag.label}</Link></li>)}
          </ul>}
          {company && <div className="text-sm leading-[1.8] text-primary">{company}</div>}
          {infoPanelHtml && <ReactSanitizedHtml className="info-panel-content text-sm leading-[1.8] text-secondary" html={infoPanelHtml} />}
        </div>
      </div>
    </div>
  </div>;
}
