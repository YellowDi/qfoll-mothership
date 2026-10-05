/**
 * [INPUT]: 依赖 React DOM、React 根组件和全局视觉样式
 * [OUTPUT]: 对外启动 React 应用
 * [POS]: React 默认运行时入口，Vue main.js 仅在兼容构建模式中使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../style.css";
import "../styles/remixicon-used.css";
import "../styles/markdown-media.css";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("React root element #app was not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
