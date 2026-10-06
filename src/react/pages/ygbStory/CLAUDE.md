# ygbStory/
> L2 | 父级: ../CLAUDE.md

云柜宝专题的封面与六章杂志式介绍：粘性港区画布 + 实色面板左右交替 (封面在左开场)，滚动驱动镜头飞向面板对侧的业务现场。主角是社会集卡，港口只出现进港/出港节点。

成员清单
YgbStory.tsx: 编排入口，封面 Cover 承担品牌标题、打字机文案、下载/后台入口与目录；CHAPTERS 集中六章文案、镜头落点、配图与锚点；滚动格 0 为封面，进入前一屏才挂载 visuals/ygbPort 场景，按滚动进度切换分镜并调用 flyTo；舞台吸顶线读根 scroll-padding-top (源自 --header-h)。
storyFigures.tsx: 配图层，五个实时配图 (追踪/派单/运单链路/车队看板/监管上报) 订阅同一场景实例；门控场景只让当前章逐帧刷新，隐藏章仍接收事件，PhoneShowcase 为 06 章唯一保留的产品截图展台。
YgbStory.css: ys-* 样式契约，瑞士网格排版与面板推入动效；视口分六档 (大屏放大字号、矮屏收紧节奏、竖屏平板底部两栏、手机底部单栏、矮手机截断正文、横屏手机侧边两栏)，配图内部用容器查询按自身宽度逐级去掉次要列。

法则: 舞台高 100dvh 跟随 iOS 地址栏、画布固定 100lvh 不触发重建，舞台不用 sticky 而用 before/pinned/after 三态定位 (区间内 fixed，避免 iOS 吸顶与画布重绘错帧抖动)；章节判定用故事高度 − 舞台高度，锚点按 svh 计算，不用会随 iOS 地址栏变化的 innerHeight，并带 6% 回差；触屏 (pointer:coarse) 以 scroll-snap 每次滑动只走一格；面板内边距让出 safe-area (灵动岛/Home 指示条)；依赖 window 滚动，固定定位的舞台不能有 transform/contain 的祖先 (容器查询基准放在舞台自身)；竖排判定只有一处来源 (STACKED 与 CSS 查询逐字一致)；数据行单元格一律单行省略；配图动画只用 transform (不动 width/left/flex-grow)、不用 mask，配图框 contain:strict 隔离布局，滚动进行中配图暂停刷新 (noteScroll)；配图只消费 visuals/ygbPort/figures 的状态，不自行模拟；不使用渐变遮罩压背景，文字只放在实色面板内。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
