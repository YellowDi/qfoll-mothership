# composables/
> L2 | 父级: ../CLAUDE.md

框架无关的浏览器交互逻辑，TypeScript 编写；React hooks 通过入口文件调用，入口之外的实现细节收在子目录。

成员清单
useInfoTagLinks.ts: 将详情标签转换为导航链接的纯适配逻辑，导出 TagTarget/InfoTagLink 类型。
useInlineVideoPlayers.ts: 内联视频播放器的编排入口 initInlineVideoPlayers，持有"当前该播哪一个"的全局裁决、可见度观察与事件接线，返回清理函数。
inlineVideo/: 内联视频的无状态能力 (类型、全屏、视口判据、控制层 UI、播放控制)，由入口编排，见其 CLAUDE.md。

法则: 只负责状态和副作用，不渲染 React；所有全局监听、定时器和媒体资源必须提供清理路径。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
