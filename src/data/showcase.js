/**
 * Showcase 演示项目数据
 * - 每个 demo 部署在 Vercel，访问按钮跳转到 demoUrl
 * - 临时使用项目内图片作为封面（public/project-images），后续可替换为专用图与真实 demoUrl
 * - repoUrl 可选，有则详情页显示「GitHub」按钮跳转代码库
 */

const showcaseList = [
  {
    id: "demo-1",
    title: "buildguard",
    shortDesc:
      "面向产业园区的巡检任务工作台，帮助巡检员管理任务、按建筑填报检查结果，并跟踪隐患与整改进展。",
    description:
      "BuildGuard 是面向产业园区的巡检任务工作台，帮助巡检员管理任务、按建筑填报检查结果，并跟踪隐患与整改进展。",
    coreCapabilities: [
      {
        title: "任务工作台",
        desc: "按「进行中 / 待完成 / 已完成」管理多园区、多周期的巡检任务",
      },
      {
        title: "建筑级巡检填报",
        desc: "以园区内建筑为单位，按消防安全、电气设备、建筑结构、仓储安全、环境卫生等类别逐项检查",
      },
      {
        title: "结构化结果记录",
        desc: "每项支持状态（正常 / 关注 / 风险 / 未检查）、备注、现场照片、描述与影响分析",
      },
      {
        title: "多园区支持",
        desc: "支持华东、华南、长三角等不同园区及各自建筑结构",
      },
    ],
    useCases: [
      "综合巡检、消防安全检查、设备维护巡检",
      "消防、电气、结构、仓储、环境等维度的标准化检查",
      "现场拍照与风险等级标注",
      "任务 deadline 管理、完成时间记录",
    ],
    cover: "/demo-images/demo-1.webp",
    coverSrcSet: undefined,
    coverVideo: "",
    coverIcon: "",
    demoUrl: "https://buildguard.vercel.app/",
    repoUrl: "https://github.com/YellowDi/buildguard",
    techStack: ["Vue 3", "TypeScript"],
    type: "小程序",
  },
  {
    id: "demo-2",
    title: "BuildGuard Admin",
    shortDesc:
      "BuildGuard 的后台管理端，面向运营与管理角色集中处理巡检任务、项目数据、状态流转与整体运营配置。",
    description:
      "BuildGuard Admin 是 BuildGuard 体系下的后台管理端，用于支撑巡检业务的后台运营与配置管理。它将任务视图、数据维护和流程管理集中到统一控制台中，方便管理人员从桌面端进行日常协作与运营决策。",
    coreCapabilities: [
      {
        title: "后台运营工作台",
        desc: "集中查看业务状态、任务进度与关键数据，支持管理角色在统一入口内完成日常操作",
      },
      {
        title: "巡检任务管理",
        desc: "对巡检任务进行创建、分配、状态跟踪与结果回查，形成完整的后台处理闭环",
      },
      {
        title: "项目与基础数据维护",
        desc: "维护园区、建筑及相关业务基础信息，为前台巡检与后续分析提供统一数据底座",
      },
      {
        title: "桌面端管理体验",
        desc: "以管理后台的信息密度与操作效率为核心，适合运营、审核与配置类场景长期使用",
      },
    ],
    useCases: [
      "运营人员统一管理 BuildGuard 巡检任务与执行状态",
      "后台维护园区、建筑及业务主数据",
      "查看任务结果并跟进异常、风险与整改流程",
      "作为桌面端控制台承接配置、审核与日常运营工作",
    ],
    cover: "/demo-images/demo-2.webp",
    coverSrcSet: undefined,
    coverVideo: "",
    coverIcon: "",
    demoUrl: "https://buildguard-admin.vercel.app/",
    repoUrl: "https://github.com/YellowDi/buildguard-admin",
    techStack: ["Web Admin", "Dashboard"],
    type: "Web 管理后台",
  },
];

const showcaseById = Object.fromEntries(showcaseList.map((d) => [d.id, d]));

export { showcaseList, showcaseById };
