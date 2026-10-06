# react/providers/
> L2 | 父级: ../CLAUDE.md

成员清单
ThemeProvider.tsx: 主题 Context、系统偏好同步和明暗模式切换边界。
DetailHeaderProvider.tsx: 详情标题、目录、活动项和导航回调的跨组件状态桥接。

法则: 全局状态只通过 Provider 暴露；组件不得直接修改 document 根节点主题类名。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
