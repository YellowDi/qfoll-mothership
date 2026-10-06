# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
createSpaFallback.js: 为静态部署产物生成 SPA 深链接 fallback，支持 React 的 dist/dist-react 与 Vue 兼容产物。
checkReactRouteCoverage.js: 对比 Vue 与 React 路由声明，阻止迁移遗漏静态路径。

法则: 脚本只服务构建和发布流程，不依赖浏览器运行时组件。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
