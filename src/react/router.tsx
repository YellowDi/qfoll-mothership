/**
 * [INPUT]: 依赖 React Router、共享静态页面配置、详情 Provider 和迁移占位页面
 * [OUTPUT]: 对外提供 React 应用路由树
 * [POS]: React 入口的 URL 映射层，覆盖现有 Vue 路由拓扑，每次完整 URL 变化重置外壳交互状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { staticPages } from "./navigation";
import { DetailHeaderProvider } from "./providers/DetailHeaderProvider";
import { ReactAppLayout } from "./layouts/ReactAppLayout";
import { ReactRoutePlaceholder } from "./components/ReactRoutePlaceholder";
import { CareersPage, PricingPage } from "./pages/ReactArticlePage";
import { ReactChangelogPage } from "./pages/ReactChangelogPage";

function AppFrame() {
  const { pathname, search, hash } = useLocation();
  return <DetailHeaderProvider key={`${pathname}${search}${hash}`}><ReactAppLayout /></DetailHeaderProvider>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppFrame />}>
        {staticPages.map(({ path, title }) => {
          const element = path === "/pricing" ? <PricingPage />
            : path === "/careers" ? <CareersPage />
              : path === "/changelog" ? <ReactChangelogPage />
                : <ReactRoutePlaceholder title={title} />;
          return <Route key={path} path={path} element={element} />;
        })}
      <Route path="/project/:id" element={<ReactRoutePlaceholder title="客户案例详情" detail />} />
      <Route path="/showcase/:id" element={<ReactRoutePlaceholder title="Showcase 详情" detail />} />
      <Route path="/news/:id" element={<ReactRoutePlaceholder title="新闻详情" detail />} />
      <Route path="/company" element={<Navigate to="/about" replace />} />
      <Route path="/cloud-cabinet" element={<Navigate to="/ygb" replace />} />
      <Route path="/contact" element={<Navigate to="/about#contact" replace />} />
      <Route path="/resources" element={<Navigate to="/design-spec" replace />} />
      <Route path="*" element={<ReactRoutePlaceholder title="页面不存在" />} />
      </Route>
    </Routes>
  );
}
