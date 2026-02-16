# 企丰科技官网（qfoll-mothership）

企丰科技品牌官网项目，基于 Vue 3 + Vite 构建的单页应用（SPA）。

## 项目目标

- 展示公司品牌信息、服务能力与项目案例
- 提供可维护的内容结构（Markdown + 元数据）
- 支持快速开发、构建和部署

## 技术栈

- 框架：Vue 3（Composition API / `<script setup>`）
- 构建工具：Vite 7
- 路由：Vue Router 4
- 样式：Tailwind CSS 4
- 内容系统：Markdown（`gray-matter` + `markdown-it`）
- 图标：Remix Icon

## 目录结构

```text
src/
├── components/      # 公共组件（Hero、About、Footer 等）
├── content/         # Markdown 内容（项目案例）
│   └── projects/    # 案例内容文件
├── data/            # 项目元数据与内容解析逻辑
├── layouts/         # 布局组件（如 AppLayout）
├── router/          # 路由配置
├── views/           # 页面视图
├── main.js          # 应用入口
└── style.css        # 全局样式
```

## 环境要求

- Node.js 18+
- npm（默认）或 pnpm

## 快速开始

```bash
# 1) 安装依赖
npm install

# 2) 启动本地开发
npm run dev
```

默认启动后可在终端提示地址访问（通常为 `http://localhost:5173`）。

## 常用命令

```bash
# 本地开发
npm run dev

# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

## 内容维护说明

项目案例内容位于 `src/content/projects/`，推荐按以下方式维护：

- 每个案例使用单独的 Markdown 文件
- 在 frontmatter 中维护标题、日期、标签、封面等元数据
- 正文使用标准 Markdown 编写，组件通过解析逻辑统一渲染

如需新增字段，请同步更新 `src/data/` 中的解析与类型映射逻辑。

## 构建产物

执行 `npm run build` 后，静态产物输出到 `dist/` 目录，可直接用于静态站点部署。

## 许可证

私有项目，未经授权请勿对外分发。
