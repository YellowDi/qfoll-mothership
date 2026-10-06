/**
 * [INPUT]: 依赖 React Router 当前参数、迁移阶段路由元数据和详情目录 hook
 * [OUTPUT]: 对外提供 React 路由占位页与可滚动详情页验证内容
 * [POS]: 阶段 2 的外壳验证边界，模拟详情标题区、h2/h3 目录和 hash 导航
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useDetailHeaderBarToc } from "../hooks/useDetailHeaderBarToc";

type Props = { title: string; description?: string; detail?: boolean };
export function ReactRoutePlaceholder({ title, description = "页面迁移将在后续阶段接入。", detail = false }: Props) {
  const params = useParams();
  const titleSectionRef = useRef<HTMLDivElement>(null);
  const contentRootRef = useRef<HTMLElement>(null);
  const detailId = params.id;
  useDetailHeaderBarToc({
    pageTitle: title,
    contentKey: detailId || title,
    titleSectionRef,
    contentRootRef,
  });
  return (
    <section className="mx-auto w-full max-w-240 px-6 pb-24 pt-10 md:px-12">
      <div ref={titleSectionRef} className="flex min-h-[55vh] flex-col justify-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-secondary">React migration preview</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-secondary md:text-lg">{description}{detailId ? ` 当前参数：${detailId}` : ""}</p>
        <div className="mt-10 flex gap-3">
          <Link to="/" className="btn-primary btn-md px-5">返回首页</Link>
          <Link to="/projects" className="btn-secondary btn-md px-5">查看路由</Link>
        </div>
      </div>
      {detail && <article ref={contentRootRef} className="detail-markdown-body mx-auto max-w-[40rem] space-y-8 pb-[60vh] text-base leading-8">
        <p>详情页外壳会在滚动到正文后把当前标题提升到顶栏，并通过目录保持定位。</p>
        <h2>目录联动</h2>
        <p>目录项目由正文标题自动生成，支持重复标题去重与当前章节高亮。</p>
        <h3>滚动定位</h3>
        <p>点击顶栏目录后，页面按固定顶栏高度进行平滑滚动，并同步地址 hash。</p>
        <h2>行为边界</h2>
        <p>离开详情页时，目录状态和 DOM 观察器会一并清理，避免跨页面泄漏。</p>
      </article>}
    </section>
  );
}
