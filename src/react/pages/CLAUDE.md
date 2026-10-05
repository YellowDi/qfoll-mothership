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
ReactYgbPage.tsx: 云柜宝产品专题，包含能力卡片、后台截图和 App 下载轮播。
ReactYgbPage.css: 云柜宝 Hero 路线图、叠层卡片和响应式过渡样式。
ReactYgbRoadMapBg.tsx: Canvas 路线网络、地块、水系与运输节点装饰层。
ReactWaterEnvPage.tsx: 水环境产品专题，包含 KPI Hero 和明暗主题功能截图。
ReactWaterEnvPage.css: 水环境 Hero 的渐变基底与明暗主题色彩。
ReactWaterSurfaceBg.tsx: Canvas 水面波纹与主题光晕装饰层。
ReactHomePage.tsx: 首页品牌、案例、新闻和能力标签墙编排。
ReactHomePage.css: 首页品牌光栅和能力标签横向动画样式。
ReactAboutSection.tsx: 首页与关于页共享的品牌首屏、内联图标和特性列表。
ReactAboutSection.css: 品牌点阵、渐隐和内联图标视觉规则。
ReactYgbPreview.tsx: 首页客户案例区的云柜宝主卡与轮播堆叠。
ReactTagMarqueeSection.tsx: 首页底部斜向标签舞台与品牌收束文案。
ReactTagMarqueeSection.css: 标签轨道、渐隐和响应式舞台动画。
ReactDesignSpecPage.tsx: 设计规范图文、媒体轮播和内联视频页面。
ReactDesignSpecPage.css: 设计规范宽媒体与响应式比例样式。
ReactTrashDutyPage.tsx: 内部值日表摘要、排班表和维护说明。

法则: 页面只编排稳定内容与数据，不复制布局外壳；复杂交互页面继续按独立页面边界迁移。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
