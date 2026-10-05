# qfoll-mothership - 企丰科技内容型官网
Vite + React 19 + TypeScript + React Router + Vue 3 兼容入口 + Tailwind CSS + Markdown/Canvas/WebGL + 本地内容数据

<directory>
src/ - 浏览器应用源码 (10个关键模块: components、views、composables、data、react、visuals、layouts、router、styles、content)
scripts/ - 构建前数据生成与 SPA 部署后处理 (3个脚本)
public/ - 不经源码导入的静态资源 (项目图片、站点图标与 manifest)
</directory>
<config>
package.json - 依赖、构建、预览和数据生成命令
vite.config.js - Vue 插件、图片优化、构建分包与产物分析
postcss.config.js - Tailwind/PostCSS 处理配置
tsconfig.json - React 迁移层 TypeScript 编译约束
tailwind.config.js - 设计令牌和 Tailwind 扩展
index.html - 应用挂载文档壳
ygb-hero-prototype.html - 云柜宝 React 视觉升级的独立港口交互原型，不接入正式路由
</config>
法则: 极简·稳定·导航·版本精确

迁移基线: React + TypeScript 迁移只改变运行时框架，优先保持路由、视觉、内容和交互行为一致；不得将视觉改版与框架迁移绑定。React 已成为默认运行时与 dist 产物，Vue 仅通过 --mode vue 保留兼容构建。
