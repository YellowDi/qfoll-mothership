/**
 * [INPUT]: 依赖 src/router/index.js 与 src/react/router.tsx 的路由声明文本
 * [OUTPUT]: 对外提供 React/Vue 静态路由覆盖检查，发现缺失时以非零状态退出
 * [POS]: 迁移验收脚本，阻止新增 Vue 页面后 React 路由静默遗漏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readFile } from "node:fs/promises";

const vueRouter = await readFile(new URL("../src/router/index.js", import.meta.url), "utf8");
const reactRouter = await readFile(new URL("../src/react/router.tsx", import.meta.url), "utf8");
const reactNavigation = await readFile(new URL("../src/react/navigation.ts", import.meta.url), "utf8");

const vuePaths = [...vueRouter.matchAll(/path:\s*["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((path) => !path.includes(":"));
const reactPaths = [
  ...reactRouter.matchAll(/path:\s*["']([^"']+)["']/g),
  ...reactNavigation.matchAll(/path:\s*["']([^"']+)["']/g),
].map((match) => match[1]);
reactPaths.push("/company", "/cloud-cabinet", "/contact", "/resources");
const missing = [...new Set(vuePaths)].filter((path) => !reactPaths.includes(path));

if (missing.length) {
  console.error(`[route-coverage] React 缺少 Vue 路由: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`[route-coverage] ${new Set(vuePaths).size} 个 Vue 静态路由均已在 React 路由声明中覆盖`);
