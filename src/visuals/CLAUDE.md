# visuals/
> L2 | 父级: ../CLAUDE.md

框架无关的原版视觉引擎：生命周期入口返回清理函数，React 适配器只负责挂载。引擎正逐个由 JS 转为 TS (已转 dotRipple、twinkleDots、textExclusions、roadMap、roadNetwork)；仅剩 ygbPort 仍为 JS，尚为 JS 的引擎 (ygbPort) 由 index.d.ts 声明对外边界，React 据此获得类型。

成员清单
roadNetwork.ts: 原路线图几何算法 (TS)，确定性生成道路、桥梁、河流、建筑与邻接图，导出 RoadNetwork 等几何类型；无随机数，同尺寸输出恒定。
roadMap.ts: 原 Canvas 静态缓存与车辆动画，控制设备像素比、帧率及可见性。
twinkleDots.ts: 原品牌点阵动画 (TS，导出 TwinkleDotsProps)，支持文字排除、随机冷却、指针轨迹与减少动画偏好。
textExclusions.ts: 品牌文字行的 DOM 几何合并，提供点阵避让区域 (TS，导出 ExclusionRect，矩形相对 root 左上角)；点阵引擎与 React 避让 hook 共用同一矩形类型。
dotRipple/: ASCII 点阵尾迹引擎 (4 个 TS 文件)，鼠标尾迹 + 点击冲击环涟漪驱动 . : + # 字符显影，默认留白；water-prototype.html 调试，正式 /water-env Hero 在视频之上经 ReactDotRippleBg 挂载。
ygbPort/: 云柜宝港区 Canvas 引擎 (17 文件 + figures 配图子模块)，岸桥逐贝装卸、车道级车流与信号、靠泊船、拖船与直升机；正式 Hero 经 ReactYgbPortBackground 挂载，原型页用于调试。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
