# react/
> L2 | 父级: ../CLAUDE.md

React 迁移地图

components/ - React 迁移层的顶栏、页脚、路由占位和常驻路由副作用组件
hooks/ - React 生命周期适配器，封装详情目录与移动端触摸保护
layouts/ - React 应用公共外壳，承接侧栏、Outlet、主题和页面标题
providers/ - React Context 边界，提供主题与详情顶栏状态
App.tsx - React 根组件，组合 BrowserRouter、ThemeProvider 和路由树
main.tsx - React 迁移预览入口，与现有 Vue main.js 并行
router.tsx - 覆盖现有 URL 拓扑的 React Router 路由树
navigation.ts - URL、页面标题、导航归属和项目排序的共享语义
types.ts - React 迁移层共享类型

法则: React 入口先独立构建和验证；页面迁移完成前不替换生产 Vue 入口。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
