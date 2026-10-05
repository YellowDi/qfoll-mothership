/**
 * [INPUT]: 依赖 assets/water-images 的四组明暗产品截图
 * [OUTPUT]: 对外提供 featureSections (Vue 兼容页的四段图文) 与 waterEnvStory (React 页 Hero 以下的总览、闭环、能力展台、模块与收束文案)
 * [POS]: 水环境页面的唯一内容源；截图集中在 screens 一处导入，两套运行时共享同一批素材，文案各自独立互不牵连
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import screen01 from "../assets/water-images/screen-01.webp";
import screen01Dark from "../assets/water-images/screen-01-dark.webp";
import screen02 from "../assets/water-images/screen-02.webp";
import screen02Dark from "../assets/water-images/screen-02-dark.webp";
import screen03 from "../assets/water-images/screen-03.webp";
import screen03Dark from "../assets/water-images/screen-03-dark.webp";
import screen04 from "../assets/water-images/screen-04.webp";
import screen04Dark from "../assets/water-images/screen-04-dark.webp";

/* ---- 产品截图：明暗成对，尺寸统一 1440×1024 ---- */
const screens = {
  map: { image: screen01, imageDark: screen01Dark },
  station: { image: screen02, imageDark: screen02Dark },
  remote: { image: screen03, imageDark: screen03Dark },
  device: { image: screen04, imageDark: screen04Dark },
};

/* ==================== Vue 兼容页：保持原样 ==================== */
export const featureSections = [
  {
    id: "monitoring",
    chip: "实时监测",
    title: "地图总览与监测点位",
    desc: "界面以 GIS 地图为核心，集中展示各区域监测站点的分布与实时状态。支持按区域、类型筛选，点击点位即可快速查看站点详情，形成可协同查看的整体监测视图。",
    ...screens.map,
  },
  {
    id: "alert",
    chip: "智能预警",
    title: "站点详情",
    desc: "站点详情页可查看站点基本信息、设备报警列表及 AI 智能预测结果。支持对预警事件进行追溯与处置跟踪，为运维决策提供数据支撑。",
    ...screens.station,
  },
  {
    id: "visualization",
    chip: "远程运维",
    title: "远程运维",
    desc: "支持对站点设备进行远程控制与运维操作，无需现场即可完成设备参数调整、启停控制等操作，提升运维效率、降低现场作业成本。",
    ...screens.remote,
  },
  {
    id: "integration",
    chip: "设备管理",
    title: "设备管理",
    desc: "集中展示所有监测设备的当前数值、运行状态及历史数据。支持按设备类型、站点筛选，支持趋势回溯与异常排查，实现设备全生命周期管理。",
    ...screens.device,
  },
];

/* ==================== React 页：Hero 以下的叙事 ==================== */
export const waterEnvStory = {
  overview: {
    id: "monitoring",
    eyebrow: "地图总览",
    title: ["一张地图，", "看清整片管网"],
    desc: "以 GIS 地图为底座，汇聚各区域监测站点的分布与实时状态。按区域、类型筛选点位，点击即可展开站点详情，调度与运维在同一视图里协同。",
    facts: [
      ["站点分布", "按区域、类型筛选"],
      ["实时状态", "正常与报警一眼可辨"],
      ["点位直达", "监测信息 · 远程控制 · 视频监控 · 报警记录"],
    ],
    ...screens.map,
  },
  loop: {
    id: "workflow",
    eyebrow: "工作方式",
    title: "从感知到处置，一条闭环",
    desc: "分散的监测节点汇入统一的数据体系，异常被提前识别、及时送达，并在线完成处置与追溯。",
    steps: [
      ["感知", "监测节点持续回传数据与设备运行状态，统一汇入平台。"],
      ["研判", "AI 智能预测结合历史趋势，在问题发生前识别风险。"],
      ["预警", "报警与预警事件自动生成，集中进入事件管理。"],
      ["处置", "远程调整参数、启停设备，现场工作纳入养护闭环。"],
    ],
  },
  showcase: {
    id: "capabilities",
    eyebrow: "核心能力",
    title: "深入每一个站点、每一台设备",
    items: [
      {
        id: "alert",
        label: "站点详情与智能预警",
        desc: "站点基本信息、设备报警列表与 AI 智能预测结果集中呈现；预警事件可追溯、可跟踪处置，为运维决策提供依据。",
        ...screens.station,
      },
      {
        id: "remote",
        label: "远程运维",
        desc: "按进水、提升、出水各环节远程查看与控制站点设备，PLC 自动与手动模式一键切换，参数调整、启停无需到场。",
        ...screens.remote,
      },
      {
        id: "devices",
        label: "设备管理",
        desc: "集中查看所有监测设备的当前数值、运行状态与历史数据；按设备类型、站点筛选，支持趋势回溯与异常排查。",
        ...screens.device,
      },
    ],
  },
  modules: {
    id: "modules",
    eyebrow: "平台模块",
    title: "八个模块，覆盖管网运维全流程",
    items: [
      ["站点地图", "GIS 总览站点分布与实时状态"],
      ["站点监控", "单站数据、视频与报警集中查看"],
      ["事件管理", "报警与预警事件的追溯与处置跟踪"],
      ["设备管理", "设备数值、运行状态与历史趋势"],
      ["养护计划", "按周期编排管网与设备养护"],
      ["养护工作", "养护任务的执行、记录与回溯"],
      ["业主管理", "业主单位与所属站点的维护"],
      ["用户管理", "账号、角色与访问权限配置"],
    ],
  },
  closing: {
    title: ["让排水管网", "可感知、可分析、可预警"],
  },
};
