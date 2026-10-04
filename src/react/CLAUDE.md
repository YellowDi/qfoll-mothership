# react/
> L2 | 父级: ../CLAUDE.md

React 迁移地图

components/ - React 迁移层的顶栏、页脚和路由占位展示组件
layouts/ - React 应用公共外壳，承接侧栏、Outlet、主题和页面标题
providers/ - React Context 边界，目前提供主题状态
App.tsx - React 根组件，组合 BrowserRouter、ThemeProvider 和路由树
main.tsx - React 迁移预览入口，与现有 Vue main.js 并行
router.tsx - 覆盖现有 URL 拓扑的 React Router 路由树
types.ts - React 迁移层共享类型

法则: React 入口先独立构建和验证；页面迁移完成前不替换生产 Vue 入口。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
