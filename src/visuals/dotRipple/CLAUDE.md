# dotRipple/
> L2 | 父级: ../CLAUDE.md

ASCII 点阵尾迹引擎：鼠标扫过留下软边尾迹，点击放出一大团不规则的冲击涟漪，强度按疏密映射为 `. : + #`；画面默认留白，字符只在指针影响处短暂浮现。框架无关，唯一入口 index.js；与 twinkleDots 同属点阵背景，但驱动源是指针而非随机闪烁，二者互不依赖。正式 /water-env Hero 经 react/pages/ReactDotRippleBg 挂载，water-prototype.html 直接挂载用于调试，二者只调用 mountDotRipple。

成员清单
index.d.ts: 入口的类型契约，DotRippleParams/Options/Handle 与 mountDotRipple；参数键与 params.js 的 PARAM_SPEC 一一对应。
index.js: 入口与渲染/生命周期层，持有字符精灵图、指针监听与强度合成 (尾迹与冲击环取 max)，仅绘制越过阈值的格子，支持可见性暂停、减少动画偏好定格与文字避让遮罩 (setExclusions)。
trail.js: 跟随层，高斯笔刷沿指针轨迹插值盖章 (max 混合不饱和)，每步轻微扩散并整体衰减，轮廓随时间变软成台阶状；不碰 DOM。
shocks.js: 点击层，每次点击放出三道冲击环 (主环 + 两道余环)，半径走缓出曲线、强度随寿命衰减；每次点击各抽一份随机形状 (谐波轮廓起伏并随时间变形、随机方向椭圆偏斜、弧段浓淡不一)，所以团块不规则且互不相同；角度相关量按 180 档查表，范围可独立调节；不碰 DOM。
params.js: 调参契约 PARAM_SPEC 与 GLYPHS 字符序列，引擎取默认值、调试台生成滑杆都来自这里。

设计决策: 默认留白而非常驻底点阵——字符只作指针影响的显影剂，底色由页面渐变负责 (参考 OpenAI Codex 页：渐变底 + 稀疏字符团，中心密、边缘疏)；跟随与点击是两套独立机制 (尾迹 vs 冲击环)，避免为了让大涟漪跑得快而牺牲尾迹的细腻；字符单色，颜色 ink 由挂载方按自己的底色传入 (setInk)，引擎不感知主题。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
