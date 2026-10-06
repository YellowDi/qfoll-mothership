# react/
> L2 | 父级: ../CLAUDE.md

React 应用地图

components/ - React 迁移层的顶栏、页脚、路由占位和常驻路由副作用组件
hooks/ - React 生命周期适配器，封装详情目录与移动端触摸保护
layouts/ - React 应用公共外壳，承接侧栏、Outlet、主题和页面标题
pages/ - 已迁移的 React 业务页面与静态文章模板
providers/ - React Context 边界，提供主题与详情顶栏状态
App.tsx - React 根组件，组合 BrowserRouter、ThemeProvider 和路由树
main.tsx - React 默认应用启动入口，初始化根组件和全局样式
motion.css - 仅由 React 入口加载的媒体减少动态规则，承载 prefers-reduced-motion 适配
router.tsx - 覆盖现有 URL 拓扑的 React Router 路由树
navigation.ts - URL、页面标题、导航归属和项目排序的共享语义
types.ts - React 迁移层共享类型

法则: React 是唯一运行时，路由、外壳与页面均在此层收敛。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
