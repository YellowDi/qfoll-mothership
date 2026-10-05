# hooks/
> L2 | 父级: ../CLAUDE.md

React 生命周期适配器

成员清单
useDetailHeaderBarToc.ts: 详情页目录采集、滚动高亮与标题栏状态同步，驱动 DetailHeaderProvider 的导航数据。
useReactDetailPageInteractions.ts: 详情正文和设计规范的剪贴板、代码复制、轮播和内联视频事件适配器。
useReactCoverVideo.ts: 封面视频的可见性观察、自动播放和手动播放状态适配器。
useMobileScrollGuards.ts: 移动端侧栏展开时的触摸与滚轮边界保护，阻止页面滚动穿透并维护可滚动容器体验。

法则: Hook 只编排浏览器生命周期和 DOM 事件，业务页面状态通过 Provider 或路由边界传递。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
