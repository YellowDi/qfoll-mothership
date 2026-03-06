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
];

const showcaseById = Object.fromEntries(showcaseList.map((d) => [d.id, d]));

export { showcaseList, showcaseById };
