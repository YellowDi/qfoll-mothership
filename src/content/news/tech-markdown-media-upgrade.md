---
id: tech-markdown-media-upgrade
title: 技术分享：Markdown 内容系统完成媒体组件升级
publishedAt: 2025-11-11
category: 技术分享
lead: 新版内容组件统一支持图片与视频编排，降低编辑门槛并提升内容呈现一致性。
cover: "/covers/hs-erp.webp"
infoTags:
  - 技术分享
  - 2025-11-11
---

为了提升内容运营效率，我们对现有 Markdown 渲染链路做了一次结构化升级。核心目标是让编辑在不引入额外 CMS 复杂度的情况下，直接通过 Markdown 实现多媒体内容管理。

升级后，内容作者可以在正文中使用统一的 media 语法插入图片与视频，系统会自动完成轮播结构渲染、交互控制与响应式适配。前端侧通过同一套解析与渲染逻辑，保证不同页面的视觉和行为一致。

:::media
- video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  caption: 视频卡片展示媒体组件对内嵌视频的支持效果。
- image: "/project-images/hs-erp/keynote-02.webp"
  caption: 图片卡片展示统一尺寸与对齐策略。
:::

这次升级也为后续新闻、案例、专题等内容模块复用打下基础，减少重复开发成本。

:::info-panel

:::
