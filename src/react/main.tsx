/**
 * [INPUT]: 依赖 React DOM、React 根组件和全局视觉样式
 * [OUTPUT]: 对外启动 React 迁移预览应用
 * [POS]: React 阶段入口，与现有 Vue main.js 并行，直到页面迁移完成
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
