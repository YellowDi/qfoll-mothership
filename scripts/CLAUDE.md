# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单
generateChangelog.js: 读取 Git 历史并生成 src/data/changelog.json。
generateDutyCalendar.js: 获取节假日数据并生成年度值日日历。
createSpaFallback.js: 为静态部署产物生成 SPA 深链接 fallback，支持传入 dist 或 dist-react。

法则: 脚本只服务构建和发布流程，不依赖浏览器运行时组件。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
