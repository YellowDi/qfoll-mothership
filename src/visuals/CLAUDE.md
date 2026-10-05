# visuals/
> L2 | 父级: ../CLAUDE.md

框架无关的原版视觉引擎：生命周期入口返回清理函数，React 与 Vue 适配器只负责挂载。

成员清单
roadNetwork.js: 原路线图几何算法，确定性生成道路、桥梁、河流、建筑与邻接图。
roadMap.js: 原 Canvas 静态缓存与车辆动画，控制设备像素比、帧率及可见性。
waterSurface.js: 原水面 WebGL 着色器和主题 uniform，同步尺寸与动画生命周期。
twinkleDots.js: 原品牌点阵动画，支持文字排除、随机冷却、指针轨迹与减少动画偏好。
textExclusions.js: 品牌文字行的 DOM 几何合并，提供点阵避让区域。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
