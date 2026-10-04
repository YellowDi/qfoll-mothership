/**
 * [INPUT]: 依赖 React 迁移层的主题与路由约定
 * [OUTPUT]: 对外提供 React 迁移层共享类型
 * [POS]: React 入口的类型边界，避免组件之间重复声明基础契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export type Theme = "light" | "dark";

export type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

export type RouteMeta = {
  path: string;
  title: string;
};
