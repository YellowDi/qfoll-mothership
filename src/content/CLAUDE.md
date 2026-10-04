# content/
> L2 | 父级: ../CLAUDE.md

成员清单
news/*.md: 新闻正文，由 data/news.js 解析并提供给新闻列表与详情页。
projects/*.md: 项目正文，由 data/projects.js 解析并提供给项目列表与详情页。

法则: Markdown 是内容源，不在页面组件内硬编码正文；解析行为统一归 data 层。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
