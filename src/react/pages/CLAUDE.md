# react/pages/
> L2 | 父级: ../CLAUDE.md

React 页面编排层

成员清单
ReactArticlePage.tsx: 定价与招聘共用的静态文章模板，集中页头、窄正文和 Markdown 语义结构。
ReactChangelogPage.tsx: 读取生成的 changelog JSON，按日期、类型和 scope 展示工程变更记录。
AboutPage.tsx: 关于页编排 Hero、伙伴案例、公司介绍与联系区，委托轮播和二维码组件承载局部交互。
AboutProjectsCarousel.tsx: 关于页伙伴案例的桌面轮播与移动横滑，复用项目索引和封面资源。
QrContactCard.tsx: 企业微信二维码的桌面指针倾斜交互，尊重减少动画偏好。
AboutPage.module.css: 关于页交互样式契约，保留二维码卡片的倾斜与高光 CSS 变量。
ReactListPage.tsx: 项目与新闻列表共用的筛选、排序、网格/列表和查询参数同步模板。
ReactShowcasePage.tsx: Showcase 自动横向轮播页面，暂停逻辑只由卡片悬停和键盘聚焦触发。
ReactShowcasePage.module.css: Showcase 轮播轨道和卡片的局部动画样式。
ReactDetailPage.tsx: 项目与新闻详情共用的标题、正文、元信息和相关推荐页面。
ReactShowcaseDetailPage.tsx: Showcase 详情 Hero、能力说明、技术栈和相关演示页面。

法则: 页面只编排稳定内容与数据，不复制布局外壳；复杂交互页面继续按独立页面边界迁移。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
