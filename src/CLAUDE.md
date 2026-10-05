# src/
> L2 | 父级: ../CLAUDE.md

源码地图

components/ - 可复用视觉和交互组件，向页面与布局提供稳定 Props 边界
composables/ - 基于 Vue 生命周期和浏览器 API 的共享交互逻辑
content/ - 新闻与项目的 Markdown 原文，数据解析由 data 层负责
data/ - 项目、新闻、产品与解析器数据入口，禁止在组件内复制内容索引逻辑
react/ - React + TypeScript 默认运行时，承接全站路由与页面
layouts/ - 应用壳层，组织侧栏、顶栏、主内容和页脚
router/ - URL 到页面组件的唯一映射，集中处理标题、重定向和滚动策略
styles/ - Markdown 媒体和图标字体等跨组件样式
views/ - 路由页面编排层，负责组合组件和页面级交互
assets/ - 由源码导入的品牌图片、字体和产品媒体
style.css - 全局设计令牌、Tailwind 基础层和通用样式
main.js - Vue 兼容模式启动入口，仅由 vite --mode vue 使用
App.vue - 路由根组件

法则: 页面负责编排，组件负责呈现，composable 负责交互，data 负责内容。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
