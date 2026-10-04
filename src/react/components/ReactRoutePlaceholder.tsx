/**
 * [INPUT]: 依赖 React Router 当前参数和迁移阶段路由元数据
 * [OUTPUT]: 对外提供 React 路由迁移占位页面
 * [POS]: 阶段 1 的路由验证边界，暂时替代尚未迁移的 Vue 页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link, useParams } from "react-router-dom";

type ReactRoutePlaceholderProps = {
  title: string;
  description?: string;
};

export function ReactRoutePlaceholder({
  title,
  description = "页面迁移将在后续阶段接入。",
}: ReactRoutePlaceholderProps) {
  const params = useParams();
  const detailId = params.id;

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-240 flex-col justify-center px-6 py-24 md:px-12">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-secondary">
        React migration preview
      </p>
      <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-base leading-8 text-secondary md:text-lg">
        {description}
        {detailId ? ` 当前参数：${detailId}` : ""}
      </p>
      <div className="mt-10 flex gap-3">
        <Link to="/" className="btn-primary btn-md px-5">
          返回首页
        </Link>
        <Link to="/projects" className="btn-secondary btn-md px-5">
          查看路由
        </Link>
      </div>
    </section>
  );
}
