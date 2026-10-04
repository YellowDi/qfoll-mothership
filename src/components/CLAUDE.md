# components/
> L2 | 父级: ../CLAUDE.md

成员清单
AboutSection.vue: 关于页和首页复用的品牌特性展示，依赖主题状态与尺寸事件。
ArticleSpeechPlayer.vue: 文章朗读控制器，封装播放、暂停、速率和进度展示。
ContentGridCard.vue: 网格内容卡片，统一封面、标签和路由跳转。
ContentListRow.vue: 列表内容行，服务新闻和项目列表的紧凑展示。
CoverImage.vue: 图片、视频封面和骨架屏适配层，处理媒体加载与降级。
DetailMetaCard.vue: 详情页元信息和标签链接卡片。
HeaderBar.vue: 顶栏、主题切换、详情标题与目录入口。
RelatedContentSection.vue: 详情页相关内容导航区块。
SiteFooter.vue: 站点页脚和返回顶部入口。
TagMarqueeSection.vue: 品牌标签滚动展示，封装响应式和性能策略。
TwinkleDotMatrixBg.vue: Canvas 点阵动画背景。
WaterEnvHeroSection.vue: 水环境产品 Hero 和 KPI 展示。
WaterSurfaceBg.vue: 水环境页面 WebGL 背景。
YgbHeroSection.vue: 云柜宝 Hero 轮播和预览展示。
YgbRoadMapBg.vue: 云柜宝路线图 Canvas 背景，复杂动画需独立维护。

法则: 组件通过 Props 接收业务数据，不直接读取页面路由数据；浏览器事件必须在生命周期清理。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
