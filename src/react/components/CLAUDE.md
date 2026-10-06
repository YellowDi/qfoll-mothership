# react/components/
> L2 | 父级: ../CLAUDE.md

成员清单
ReactHeaderBar.tsx: React 迁移层顶栏，提供品牌入口、主题切换和侧栏开关；主行 h-header、移动端详情副标题行 h-header-subbar，均为固定高度令牌。
ReactRoutePlaceholder.tsx: 非业务路由与迁移兜底页面，验证详情标题、目录和 hash 导航行为。
ReactDetailMetaCard.tsx: 项目与新闻详情共用的标签、公司和信息面板卡片。
ReactSanitizedHtml.tsx: Markdown 详情 HTML 的 DOMPurify 清洗与 DOM 挂载边界，保留媒体增强所需的 data 属性。
ReactRelatedContentSection.tsx: 详情页底部相关项目、新闻和 Showcase 卡片导航。
ReactArticleSpeechPlayer.tsx: 基于浏览器 SpeechSynthesis 的文章朗读控制器。
RouteEffects.tsx: 常驻路由副作用，处理页面标题、hash 定位和历史滚动恢复；滚动位置随 scroll 事件实时记账 (不在 effect 清理时补记，保证 StrictMode 重放幂等)，hash 定位与前进后退恢复都经 trackUntilSettled 等内容到齐 (随 DOM/尺寸变化重试，用户滚动或超时放弃)，hash 避让交给根 scroll-padding。
ReactSiteFooter.tsx: React 迁移层页脚，复用备案、版本和返回顶部约定。
ReactCoverImage.tsx: React 内容卡片统一封面、视频预览、加载状态和图标降级。

法则: 组件只处理呈现和事件回调。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
