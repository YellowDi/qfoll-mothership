# react/layouts/
> L2 | 父级: ../CLAUDE.md

成员清单
ReactAppLayout.tsx: React 公共应用外壳，组织侧栏、移动端遮罩、触摸保护、Outlet、顶栏和页脚；Outlet 容器统一以 pt-header (--header-h) 为 fixed 顶栏留位，页面不再各自补偿顶栏高度。

法则: 布局只承载跨页面外壳状态；具体页面通过 React Router Outlet 注入。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
