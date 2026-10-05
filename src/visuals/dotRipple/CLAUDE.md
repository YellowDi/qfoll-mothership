# dotRipple/
> L2 | 父级: ../CLAUDE.md

ASCII 点阵涟漪引擎：二维波动方程驱动的字符场，画面默认留白，波幅越过阈值处才依强弱浮现 `. : + #`。框架无关，唯一入口 index.js；与 twinkleDots 同属点阵背景，但驱动源是波场而非随机闪烁，二者互不依赖。正式 /water-env Hero 经 react/pages/ReactDotRippleBg 挂载，water-prototype.html 直接挂载用于调试，二者只调用 mountDotRipple。

成员清单
index.js: 入口与渲染/生命周期层，持有时间轴、字符精灵图、指针监听，固定 60Hz 步长推进波场，仅绘制越过阈值的格子，支持可见性暂停、减少动画偏好定格与文字避让遮罩 (setExclusions)。
field.js: 波场物理层，格子宽高比补偿的离散波动方程 + 高斯水滴注入，固定端边界；不碰 DOM，可单测。
params.js: 调参契约 PARAM_SPEC 与 GLYPHS 字符序列，引擎取默认值、调试台生成滑杆都来自这里。

设计决策: 默认留白而非常驻底点阵——字符只作涟漪的显影剂，底色由页面渐变负责 (参考 OpenAI Codex 页：渐变底 + 稀疏白色字符)；字符单色，颜色 ink 由挂载方按自己的底色传入 (setInk)，引擎不感知主题；波只来自指针，没有环境雨点；默认波速慢、余波短。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
