# inlineVideo/
> L2 | 父级: ../CLAUDE.md

内联视频播放器的能力层：入口 useInlineVideoPlayers.ts 持有全局状态与裁决，这里的模块都是围绕 InlinePlayer 这份可变记录工作的函数，不自建状态。依赖方向单向：playback → ui → fullscreen，viewport 与 types 独立。

成员清单
types.ts: InlinePlayer/VideoUi 状态与 DOM 句柄的唯一定义，以及 lib.dom 未收录的 WebKit 私有全屏 API 类型。
fullscreen.ts: 全屏状态判定、内联展示还原与 iOS 退出全屏后的视口漂移补偿；不依赖播放与 UI。
viewport.ts: 视口/轨道可见度阈值与"谁该播放"的打分判据，纯函数。
ui.ts: 控制层 DOM 的一次性构建与状态单向同步 (图标、时间、进度、菜单)，不绑定事件。
playback.ts: source 懒加载/卸载与断点续播、播放暂停、带时间戳的分享链接复制、全屏切换；每次变更后回写 UI。

法则: 能力层不持有跨播放器状态；新增状态先扩展 types.ts，再由入口接线。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
