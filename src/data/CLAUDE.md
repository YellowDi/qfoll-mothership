# data/
> L2 | 父级: ../CLAUDE.md

内容域 TypeScript 模块：Markdown 经解析后以带类型的索引对外提供，React 页面直接消费这些类型而不各自重声明。

成员清单
types.ts: 内容域类型边界，Frontmatter、CoverAsset、轮播与 ParsedMarkdown，以及项目/新闻共有的 ContentBase 与各自的 ProjectEntry/NewsEntry。
contentParserShared.ts: Markdown、代码高亮、Mermaid 和媒体增强的共享解析边界，自研 frontmatter 解析只产出字符串与字符串数组。
coverAssets.ts: 内容标识到封面与媒体资源的映射。
news.ts: 新闻 Markdown、元数据和列表索引。
projects.ts: 项目 Markdown、元数据和列表索引。
waterEnvFeatures.ts: 水环境页唯一内容源，截图明暗成对集中导入；waterEnvStory 承载 Hero 以下的总览、闭环、能力展台、模块与收束文案。

法则: 内容数据是唯一事实来源；页面不得重复维护项目、新闻或资源索引；形状变更先改 types.ts。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
