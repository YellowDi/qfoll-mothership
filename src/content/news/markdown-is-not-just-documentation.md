---
id: markdown-is-not-just-documentation
title: Markdown 不只是文档
publishedAt: 2026-02-19
category: 技术分享
lead: 我们如何实现内容到页面的一体化生成
cover: /covers/markdown-is-not-just-documentation.webp
infoTags:
  - 技术分享
  - 2026-02-19
---

这篇文章讨论的核心不是「Markdown 可以转成 HTML」这一基础事实，而是如何把 Markdown 变成站点级的「内容输入协议」。所谓「输入协议」，指的是一份内容在进入系统后，能够经过固定链路得到稳定的结构、交互与视觉结果，并且在多端环境中保持一致。

在当前站点中，Markdown 已经承担以下职责：

1. 作为内容源，承载结构化元数据与正文语义。
2. 作为页面源，驱动文章详情页、列表页、推荐区等模块。
3. 作为回归样本，验证排版系统在复杂组合场景下的稳定性。

这意味着系统目标不再是「能显示」，而是「可规模化生产」。

## 一体化链路总览

当前实现可拆分为五层：

```text
Markdown 文件
  -> 内容建模层（frontmatter + 正文）
  -> 解析渲染层（markdown-it + 自定义规则）
  -> 结构增强层（表格包裹、代码复制、媒体交互）
  -> 样式系统层（token、节奏、断点）
  -> 页面装配层（详情页、列表页、周边模块）
```

这五层形成明确边界：

- 「建模层」只关心字段完整性与内容结构。
- 「渲染层」只关心语法到 DOM 的映射。
- 「增强层」只关心交互行为与可用性兜底。
- 「样式层」只关心阅读节奏与跨端一致性。
- 「装配层」只关心路由页面如何消费上述产物。

分层带来的直接收益是「可维护性」：新增能力时不需要修改整条链路，单层可独立演进。

## 内容建模：frontmatter 与正文解耦

每篇文章由两部分组成：

- frontmatter：`id`、`title`、`publishedAt`、`cover`、`infoTags` 等结构化字段。
- body：Markdown 正文，承载标题、段落、列表、代码块、表格、引用和自定义块。

解析流程先提取 frontmatter，再处理正文内容。字段稳定后，文章卡片、发布时间展示、文章详情页标题、相关推荐筛选等都可以共享同一来源，避免「同一信息在多个页面重复维护」。

## 解析渲染：在 markdown-it 上扩展「可控结构」

系统使用 `markdown-it` 作为基础解析器，并在其上增加自定义规则。关键点不是「渲染出 HTML」，而是「渲染出可增强、可样式化的结构」。

```js
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  return renderMarkdownCodeBlock(token.content, token.info);
};

md.renderer.rules.code_block = (tokens, idx) => {
  const token = tokens[idx];
  return renderMarkdownCodeBlock(token.content, 'text');
};
```

这段规则的意义在于：围栏代码与缩进代码都进入统一渲染函数，后续复制按钮、语言标签、语法高亮、滚动容器都可以在同一结构中实现，不会出现「一种代码块可复制、另一种不可复制」的体验分裂。

## 代码块实现：语言识别、高亮与复制反馈

代码块生成结构采用「卡片容器 + 工具栏 + 代码区」：

```html
<div class="md-code-block" data-code-lang="javascript">
  <div class="md-code-toolbar">
    <span class="md-code-lang">javascript</span>
    <button class="md-code-copy" type="button">复制</button>
  </div>
  <pre class="md-code-pre"><code class="language-javascript hljs">...</code></pre>
</div>
```

高亮策略分三步：

1. 有显式语言且可识别：按指定语言高亮。
2. 无显式语言：自动识别。
3. 高亮异常或语言不可识别：回退到安全转义文本。

复制策略采用事件代理，统一监听 Markdown 容器内 `.md-code-copy` 点击事件。复制成功后通过 `data-copied='true'` 与文本切换提供短时反馈，再自动复位，避免按钮状态残留。

## media 组件实现：从语法声明到交互闭环

media 组件是本次升级的重点，它负责把多媒体内容纳入同一阅读流，而不是额外拼装一个孤立模块。

:::media
- video: https://video.cdn.queniuqe.com/store_trailers/256878929/movie_max_vp9.webm
  caption: 视频卡片展示媒体组件对内嵌视频的支持效果。
- image: https://shared.cdn.queniuqe.com/store_item_assets/steam/apps/1850570/ss_f64a1140651ff5af30eb63bb6e5b41753d00a98e.1920x1080.jpg?t=1764081491
  caption: 图片卡片展示统一尺寸与对齐策略。
- image: https://shared.cdn.queniuqe.com/store_item_assets/steam/apps/1850570/ss_4b6d7d010d1701b2b57bf8ef1b4975a04b3d632f.1920x1080.jpg?t=1764081491
  caption: 图片卡片展示统一尺寸与对齐策略。
- image: https://shared.cdn.queniuqe.com/store_item_assets/steam/apps/1850570/ss_bc8812817c074772822c1d1e8a6b016983cf05e8.1920x1080.jpg?t=1764081491
  caption: 图片卡片展示统一尺寸与对齐策略。
- image: https://shared.cdn.queniuqe.com/store_item_assets/steam/apps/1850570/ss_d47bde2e349606b3ef1f641e2d8fb7ccf1adba77.1920x1080.jpg?t=1764081491
  caption: 图片卡片展示统一尺寸与对齐策略。
:::

### 1) 语法输入

media 使用统一块语法输入，支持 `video`、`image`、`caption` 等字段。内容文件中只声明「媒体数据」，不声明「交互结构」。

### 2) 结构生成

解析阶段根据每个 slide 生成统一卡片结构，附加 `data-carousel-id` 与 `data-index`，作为交互层定位锚点。

```js
const slides = parseWideCarouselBlock(block);
const carouselId = `carousel-${id}-${carouselIndex}`;
const slidesHtml = renderSlidesHtml(slides, carouselId, defaultImageAlt);
```

### 3) 交互增强

增强层在挂载后处理以下行为：

- 上一张、下一张导航。
- 当前卡片对齐正文中心。
- 视频的内联播放、进度控制、播放速率切换。
- resize 与方向变化时的宽度与位置重算。

### 4) 视觉策略

media 使用全宽策略承载视觉信息，但通过「正文版心对齐」保持阅读关系，避免内容视觉重心漂移。简而言之：容器可以宽，语义起点要稳。

## 样式系统：通用规则与特殊元素单独处理

样式层通过 token 统一视觉基线，例如：

- `--md-card-bg`
- `--md-card-radius`
- `--md-card-pad`
- `--md-list-block-gap`

同时，系统明确把以下元素从通用规则中单独摘出：

- `blockquote`
- 顶层 `ul/ol`
- `.md-code-block`
- `.md-table`

如果这些元素继续走通用 `:not(.md-media)` 规则，就会在断点切换时发生覆盖冲突，典型表现是「桌面正常、平板错位」或「某类块级元素贴边」。

## Markdown 样式演示基线

下面保留完整演示内容，用于验证排版系统在组合场景下的稳定性。

# 一级标题

## 二级标题

### 三级标题

标题层级演示只保留到三级。正文会穿插 **强调**、*语气变化*、`行内代码`、以及 [链接能力](https://example.com)，用于验证行内语义在真实段落中的表现，而不是孤立展示样式片段。

## 段落

这是一个普通段落，用于观察阅读密度、行长与段落间距在当前断点下是否稳定。第二段用于验证连续文本情境下的节奏一致性，避免出现上下文切换时的留白突变。

这是第二个段落，保持较长文本长度，以观察中文内容在多端宽度下的断行与视线流。

这一行  
通过行尾换行继续下一句。

## 引用

> 在这里展示一段用于排版测试的示例文字内容，仅作为设计布局参考，并不代表最终正文。通过这种方式可以更好地观察段落之间的留白、字体大小与行间距效果，从而专注在整体界面视觉与信息层级的调整上，而不必纠结实际内容本身。当前这段文字长度适中，适合用于展示多行文本在不同设备与屏幕宽度下的换行情况。
>
> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## 无序列表

- 列表项 1
- 列表项 2
  - 子列表项 2.1
  - 子列表项 2.2
- 列表项 3

## 有序列表

1. 第一项
2. 第二项
3. 第三项
   1. 子项 3.1
   2. 子项 3.2

## 代码块

    这是使用缩进方式创建的代码块
    保留原始格式
    不指定语言

```
普通代码块
没有指定语言
```

```javascript
function hello() {
  console.log('Hello Markdown');
}
```

```css
.container {
  display: flex;
}
```

## 表格

表格能力放在这里与样式演示相邻，原因是表格的价值不仅在「数据可展示」，更在「复杂内容可读」。系统中的表格实现分为三步：

1. 渲染后自动包裹：把原生 `table` 包进 `.md-table`，为滚动与样式提供稳定锚点。
2. 结构安全兜底：包裹时检测父级是否已经是 `.md-table`，避免重复包裹造成层级污染。
3. 体验一致治理：仅让表格局部横向滚动，不让整页横向滚动；并通过表头、分隔线、悬浮态与圆角策略维持可扫读性。

对应的增强逻辑可概括为：

```js
const tables = markdownRoot.querySelectorAll('table');
tables.forEach((table) => {
  const parent = table.parentElement;
  if (!parent || parent.classList.contains('md-table')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'md-table';
  parent.insertBefore(wrapper, table);
  wrapper.appendChild(table);
});
```

这类处理的关键在于「自动化且幂等」。自动化保证内容无需手工改写，幂等保证路由切换或内容更新时不会重复改造同一节点。

| 表头 1 | 表头 2 | 表头 3 |
| ------ | ------ | ------ |
| 内容 A | 内容 B | 内容 C |
| 内容 D | 内容 E | 内容 F |

| 左对齐 | 居中对齐 | 右对齐 |
| :----- | :------: | -----: |
| 文本 A | 文本 B   | 12345  |
| 更长的文本内容测试 | 居中内容 | 987654321 |

| 项目 | 数量 | 单价 | 总价 |
|------|-----:|-----:|-----:|
| 商品 A | 2 | 199.00 | 398.00 |
| 商品 B | 10 | 9.90 | 99.00 |
| 合计 |  |  | 497.00 |

| ID | 名称 | 类型 | 状态 | 备注 |
|----|------|------|------|------|
| 10001 | 测试项目 Alpha | SaaS | 运行中 | 这是一段很长很长的文本，用来测试在单元格中是否会自动换行，以及列宽是否保持稳定 |
| 10002 | 测试项目 Beta | 私有部署 | 已暂停 | - |

| 模块 | 功能 |
|------|------|
| 用户系统 | - 登录<br>- 注册<br>- 找回密码 |
| 内容系统 | - 发布文章<br>- 草稿箱<br>- 标签管理 |

## 嵌套结构测试

> 引用中包含列表
>
> - 项目 A
> - 项目 B
>
> 缩进代码块
> ```css
> .container {
>  display: flex;
>}
>```

:::info-panel

:::

## 总结

本次升级的结果，不是新增了一组样式，而是建立了「Markdown -> 页面」的稳定生产路径。内容进入系统后，会经过固定建模、解析、增强与样式治理过程，最终得到可发布、可回归、可演进的网页结果。

从工程结构看，链路已经具备三个关键特征：

1. 可组合：`frontmatter` 与正文职责清晰，自定义块与基础语法可并行扩展。
2. 可增强：渲染结构预留了交互锚点，代码复制、表格包裹、媒体控制可按需叠加。
3. 可治理：样式 token、节奏规则与特殊元素隔离策略明确，回归定位成本可控。

从体验结果看，这条链路保证了「同一份内容在不同页面与终端上的一致表达」。标题层级、段落节奏、列表缩进、引用卡片、代码块与表格不再是割裂模块，而是同一阅读系统中的不同语义层。

从长期演进看，后续重点不在「再写更多样式」，而在两类持续能力建设：

1. 语法能力扩展：在不破坏现有内容的前提下，增加更多可复用自定义块与结构化能力。
2. 质量基线治理：持续维护测试样本与回归流程，把断点一致性、样式覆盖冲突、交互稳定性纳入常规发布标准。

当 Markdown 从「静态文本」转变为「页面输入协议」之后，内容系统的核心价值也随之改变：生产效率、表现一致性与演进可靠性可以同时成立，而不必互相牺牲。
