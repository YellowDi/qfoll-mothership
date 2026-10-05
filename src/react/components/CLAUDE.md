# react/components/
> L2 | 父级: ../CLAUDE.md

成员清单
ReactHeaderBar.tsx: React 迁移层顶栏，提供品牌入口、主题切换和侧栏开关。
ReactRoutePlaceholder.tsx: 非业务路由与迁移兜底页面，验证详情标题、目录和 hash 导航行为。
ReactDetailMetaCard.tsx: 项目与新闻详情共用的标签、公司和信息面板卡片。
ReactRelatedContentSection.tsx: 详情页底部相关项目、新闻和 Showcase 卡片导航。
ReactArticleSpeechPlayer.tsx: 基于浏览器 SpeechSynthesis 的文章朗读控制器。
RouteEffects.tsx: 常驻路由副作用，处理页面标题、hash 定位和历史滚动恢复。
ReactSiteFooter.tsx: React 迁移层页脚，复用备案、版本和返回顶部约定。

法则: 组件只处理 React 迁移层的呈现和事件回调，不直接读取 Vue 状态。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
