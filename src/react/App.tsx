/**
 * [INPUT]: 依赖 React Router、主题 Provider、常驻路由副作用和 React 路由树
 * [OUTPUT]: 对外提供 React 迁移层根组件
 * [POS]: React 应用根节点，组合全局主题、路由和公共外壳
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { RouteEffects } from "./components/RouteEffects";
import { ThemeProvider } from "./providers/ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouteEffects />
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
