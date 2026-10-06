/**
 * [INPUT]: 依赖 React Context、浏览器媒体查询、localStorage 和 document 根节点
 * [OUTPUT]: 对外提供 ThemeProvider 与 useTheme
 * [POS]: React 应用的全局主题状态边界，遵循系统主题优先规则，手动切换仅保存当次选择
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { Theme, ThemeContextValue } from "../types";

const userStorageKey = "qf-theme-user";
const legacyStorageKey = "qf-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const getPreferredTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(getPreferredTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? "dark" : "light");
    };
    mediaQueryList.addEventListener("change", onSystemThemeChange);
    return () => mediaQueryList.removeEventListener("change", onSystemThemeChange);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(userStorageKey, nextTheme);
    window.localStorage.removeItem(legacyStorageKey);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    isDark: theme === "dark",
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
