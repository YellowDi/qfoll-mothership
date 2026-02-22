# 企丰科技官网

基于 Vue 3 + Vite 构建的品牌官网，展示公司信息、客户案例与动态内容。

## 功能概览

- **品牌与业务**：首页、客户案例、产品页
- **内容中心**：最新动态、文章详情，支持 Mermaid 图表、KaTeX 公式、代码高亮
- **其它页面**：联系我们、定价、工作机会、设计规范

## 技术栈


| 类别  | 技术                                          |
| --- | ------------------------------------------- |
| 框架  | Vue 3（Composition API）                      |
| 构建  | Vite 7                                      |
| 路由  | Vue Router 4                                |
| 样式  | Tailwind CSS 4                              |
| 内容  | Markdown + 自定义 frontmatter                  |
| 渲染  | markdown-it、Mermaid、highlight.js、KaTeX      |
| 图片  | vite-imagetools、vite-plugin-image-optimizer |


## 项目结构

```
src/
├── components/     # 公共组件（HeaderBar、CoverImage、ContentListRow 等）
├── composables/    # 组合式逻辑（主题、详情页交互、语音朗读等）
├── content/        # Markdown 内容
│   ├── projects/   # 客户案例
│   └── news/       # 新闻文章
├── data/           # 内容解析与元数据（projects.js、news.js、contentParserShared.js）
├── layouts/        # 布局（AppLayout）
├── router/         # 路由配置
├── styles/         # 全局样式与 Markdown 排版
├── views/          # 页面视图
├── App.vue
├── main.js
└── style.css
```

## 环境要求

- Node.js 18+
- npm 或 pnpm

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认地址：`http://localhost:5173`

## 常用命令


| 命令                | 说明     |
| ----------------- | ------ |
| `npm run dev`     | 本地开发   |
| `npm run build`   | 生产构建   |
| `npm run preview` | 预览构建产物 |


## 构建与部署

`npm run build` 后静态产物输出到 `dist/`，可直接部署到任意静态托管服务。

## 许可证

私有项目，未经授权请勿对外分发。