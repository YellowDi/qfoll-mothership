# qfoll-mothership - 企丰科技内容型官网
Vite 8 + React 19 + TypeScript + React Router + Tailwind CSS + Markdown/Canvas/WebGL + 本地内容数据

<directory>
src/ - 浏览器应用源码 (6个关键模块: react、composables、data、visuals、styles、content)
scripts/ - 构建后处理 (1个脚本: SPA 深链接 404 fallback)
public/ - 不经源码导入的静态资源 (项目图片、站点图标、manifest 与 water-env Hero 视频和首帧封面)
</directory>
<config>
package.json - 依赖与 dev/build/preview/typecheck 命令，build 串联类型检查、Vite 构建与 404 fallback
vite.config.js - Vite 8 (Rolldown) + React 插件、图片优化、manualChunks 分包与产物分析 (stats.html)
postcss.config.js - Tailwind/PostCSS 处理配置
tsconfig.json - src 全部源码 (react、data、composables、visuals) 的 TypeScript 编译约束 (仅 noEmit 类型检查)；src 内已无 JS
tailwind.config.js - 设计令牌和 Tailwind 扩展
index.html - 应用挂载文档壳
</config>
法则: 极简·稳定·导航·版本精确

运行时: React 是唯一运行时，Vue 兼容构建与源码已移除，历史可从 git 追溯。构建需 Node 20.19+/22.12+。
本地私有: makefile 与 push.sh 被 gitignore，用于手动部署，不入库。
产品决定: 云柜宝专题 /ygb 为港区杂志式介绍 (src/react/pages/ygbStory)。
