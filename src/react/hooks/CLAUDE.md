# hooks/
> L2 | 父级: ../CLAUDE.md

React 生命周期适配器

成员清单
useDetailHeaderBarToc.ts: 详情页目录采集、滚动高亮与标题栏状态同步，驱动 DetailHeaderProvider 的导航数据。
useReactDetailPageInteractions.ts: 详情正文和设计规范的剪贴板、代码复制、表格、图片轮播、Mermaid 与内联视频增强适配器。
useReactCoverVideo.ts: 封面视频的可见性观察、自动播放和手动播放状态适配器。
useTypedPain.ts: 云柜宝运输痛点词的打字机节奏，ReactYgbHero 与 ygbStory 封面共用，尊重减少动态偏好。
useTextExclusions.ts: 按 data-dot-avoid 标记采集文案矩形并随尺寸变化更新，供点阵类背景避让文字，几何委托 visuals/textExclusions。
useMobileScrollGuards.ts: 移动端侧栏展开时的触摸与滚轮边界保护，阻止页面滚动穿透并维护可滚动容器体验。

法则: Hook 只编排浏览器生命周期和 DOM 事件，业务页面状态通过 Provider 或路由边界传递。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
