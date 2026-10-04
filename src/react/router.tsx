/**
 * [INPUT]: 依赖 React Router 路由组件和 React 迁移占位页面
 * [OUTPUT]: 对外提供 React 应用路由树
 * [POS]: React 入口的 URL 映射层，阶段 1 先覆盖现有 Vue 路由拓扑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ReactAppLayout } from "./layouts/ReactAppLayout";
import { ReactRoutePlaceholder } from "./components/ReactRoutePlaceholder";

function AppFrame() {
  const { pathname } = useLocation();
  return <ReactAppLayout key={pathname} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppFrame />}>
      <Route path="/" element={<ReactRoutePlaceholder title="企丰科技" description="React 应用外壳已经就绪，首页内容将在后续页面迁移阶段接入。" />} />
      <Route path="/projects" element={<ReactRoutePlaceholder title="客户案例" />} />
      <Route path="/project/:id" element={<ReactRoutePlaceholder title="客户案例详情" />} />
      <Route path="/showcase" element={<ReactRoutePlaceholder title="Showcase" />} />
      <Route path="/showcase/:id" element={<ReactRoutePlaceholder title="Showcase 详情" />} />
      <Route path="/news" element={<ReactRoutePlaceholder title="最新动态" />} />
      <Route path="/news/:id" element={<ReactRoutePlaceholder title="新闻详情" />} />
      <Route path="/company" element={<Navigate to="/about" replace />} />
      <Route path="/ygb" element={<ReactRoutePlaceholder title="云柜宝" />} />
      <Route path="/water-env" element={<ReactRoutePlaceholder title="水环境智慧监控" />} />
      <Route path="/cloud-cabinet" element={<Navigate to="/ygb" replace />} />
      <Route path="/about" element={<ReactRoutePlaceholder title="关于我们" />} />
      <Route path="/contact" element={<Navigate to="/about#contact" replace />} />
      <Route path="/pricing" element={<ReactRoutePlaceholder title="定价" />} />
      <Route path="/careers" element={<ReactRoutePlaceholder title="工作机会" />} />
      <Route path="/design-spec" element={<ReactRoutePlaceholder title="设计规范" />} />
      <Route path="/changelog" element={<ReactRoutePlaceholder title="更新日志" />} />
      <Route path="/internal/trash-duty-9f3k" element={<ReactRoutePlaceholder title="内部值日表" />} />
      <Route path="/resources" element={<Navigate to="/design-spec" replace />} />
      <Route path="*" element={<ReactRoutePlaceholder title="页面不存在" />} />
      </Route>
    </Routes>
  );
}
