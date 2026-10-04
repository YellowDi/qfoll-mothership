# composables/
> L2 | 父级: ../CLAUDE.md

成员清单
anchoredPanel.js: 基于窗口和元素布局计算锚定面板位置。
useDetailHeaderBarToc.js: 观察详情标题、滚动和 hash，驱动顶栏目录。
useDetailPageInteractions.js: 编排富文本复制、表格、媒体和对齐增强。
useFilterSortListPage.js: 提供列表筛选、排序、查询同步和响应式面板。
useHeaderBarDetailTitle.js: 顶栏详情标题的共享响应式状态。
useInfoTagLinks.js: 将详情标签转换为导航链接的纯适配逻辑。
useInlineVideoPlayers.js: 初始化、控制和清理 Markdown 内联视频播放器。
useSpeechSynthesis.js: 适配浏览器 SpeechSynthesis API。
useTheme.js: 初始化、读取和切换全局明暗主题。

法则: composable 只负责状态和副作用，不渲染 DOM；所有全局监听、定时器和媒体资源必须提供清理路径。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
