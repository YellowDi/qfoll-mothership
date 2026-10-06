/**
 * [INPUT]: 依赖 React DOM、React 根组件、共享视觉样式和 React 专属动画适配
 * [OUTPUT]: 对外启动 React 应用
 * [POS]: 应用唯一运行时入口，由 index.html 直接加载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../style.css";
import "../styles/remixicon-used.css";
import "../styles/markdown-media.css";
import "./motion.css";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("React root element #app was not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
