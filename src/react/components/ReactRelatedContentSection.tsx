/**
 * [INPUT]: 依赖相关内容数组、路由地址和卡片元信息派生器
 * [OUTPUT]: 对外提供详情页底部相关内容导航
 * [POS]: 项目、新闻与 Showcase 详情的统一收束区块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";

type Item = { id: string; title: string; cover?: string; coverSrcSet?: string; tag?: string; category?: string; year?: string | number; yearLabel?: string; publishedAt?: string; techStack?: string[]; type?: string };
type Props = { title: string; viewAllTo: string; items: Item[]; itemTo: (item: Item) => string; primaryMeta: (item: Item) => string | number | undefined; secondaryMeta: (item: Item) => string | number | undefined };

function imageSrc(value: string | undefined) {
  const match = String(value || "").match(/url\((['"]?)(.*?)\1\)/);
  return match?.[2] || value || "";
}

export function ReactRelatedContentSection({ title, viewAllTo, items, itemTo, primaryMeta, secondaryMeta }: Props) {
  if (!items.length) return null;
  return <div className="mx-auto mt-10 w-full max-w-360 overflow-x-hidden">
    <div className="mx-auto flex w-full items-center justify-between px-6 md:px-16"><h3 className="text-lg font-medium">{title}</h3><Link className="btn-text text-sm" to={viewAllTo}>查看全部</Link></div>
    <div className="mx-auto w-full px-6 pb-20 pt-6 md:px-16">
      <div className="no-scrollbar grid grid-cols-3 gap-6 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:overflow-x-auto max-md:pb-4 max-md:pr-6">
        {items.map((item) => <Link key={item.id} to={itemTo(item)} className="group overflow-hidden rounded-md max-md:min-w-[72%] max-md:shrink-0 max-md:snap-start">
          <div className="aspect-square w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800/35"><img src={imageSrc(item.cover)} srcSet={item.coverSrcSet || undefined} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" /></div>
          <div className="pt-4 text-left"><div className="text-xl font-medium leading-[1.3] text-primary max-md:text-lg">{item.title}</div><div className="mt-4 flex items-center gap-2 text-sm"><span className="font-medium text-primary">{primaryMeta(item)}</span><span className="text-secondary">{secondaryMeta(item)}</span></div></div>
        </Link>)}
      </div>
    </div>
  </div>;
}
