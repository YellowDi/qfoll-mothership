/**
 * [INPUT]: 依赖 React Router、应用版本和浏览器滚动 API
 * [OUTPUT]: 对外提供 React 迁移层页脚
 * [POS]: React 应用外壳的底部公共区域，保持现有备案与版本入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export function ReactSiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-bg/92 backdrop-blur-md">
      <div className="relative mx-auto flex w-full max-w-360 items-center justify-end px-14 py-6 text-sm text-secondary max-lg:flex-col max-lg:items-center max-lg:gap-3 max-lg:px-5">
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center max-lg:static max-lg:translate-x-0">
          <span className="block lg:inline">© {currentYear} 宁波企丰信息科技有限公司</span>
          <span className="mx-2 text-secondary max-lg:hidden">·</span>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto block text-secondary transition-colors hover:text-primary max-lg:mt-1 lg:inline"
          >
            浙ICP备2022008031号-1
          </a>
          <span className="mx-2 text-secondary max-lg:hidden">·</span>
        </div>
        <button
          type="button"
          className="btn-neutral btn-neutral-primary gap-1 px-5 max-lg:hidden"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          返回顶部
          <i className="ri-arrow-up-line text-sm" aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
