# src/
> L2 | 父级: ../CLAUDE.md

源码地图

composables/ - 框架无关的浏览器交互逻辑，供 React hooks 复用
content/ - 新闻与项目的 Markdown 原文，数据解析由 data 层负责
data/ - 项目、新闻、产品与解析器数据入口，禁止在组件内复制内容索引逻辑
visuals/ - 框架无关的原版 Canvas/WebGL 与文字避让引擎；ygbPort/ 为云柜宝港区新引擎
react/ - React + TypeScript 默认运行时，承接全站路由与页面
styles/ - Markdown 媒体和图标字体等跨组件样式
assets/ - 由源码导入的品牌图片、字体和产品媒体
style.css - 全局设计令牌、Tailwind 基础层和通用样式

法则: react/ 负责编排与呈现，composables 负责交互，data 负责内容。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
