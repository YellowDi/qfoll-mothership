# react/
> L2 | 父级: ../CLAUDE.md

React 迁移地图

components/ - React 迁移层的顶栏、页脚、路由占位和常驻路由副作用组件
hooks/ - React 生命周期适配器，封装详情目录与移动端触摸保护
layouts/ - React 应用公共外壳，承接侧栏、Outlet、主题和页面标题
pages/ - 已迁移的 React 业务页面与静态文章模板
providers/ - React Context 边界，提供主题与详情顶栏状态
App.tsx - React 根组件，组合 BrowserRouter、ThemeProvider 和路由树
main.tsx - React 默认应用启动入口，初始化根组件和全局样式
router.tsx - 覆盖现有 URL 拓扑的 React Router 路由树
navigation.ts - URL、页面标题、导航归属和项目排序的共享语义
types.ts - React 迁移层共享类型

法则: React 入口是默认生产运行时；Vue 入口只作为显式兼容模式保留。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
