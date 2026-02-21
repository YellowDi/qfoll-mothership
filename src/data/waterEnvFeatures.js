import screen01 from "../assets/water-images/screen-01.webp";
import screen01Dark from "../assets/water-images/screen-01-dark.webp";
import screen02 from "../assets/water-images/screen-02.webp";
import screen02Dark from "../assets/water-images/screen-02-dark.webp";
import screen03 from "../assets/water-images/screen-03.webp";
import screen03Dark from "../assets/water-images/screen-03-dark.webp";
import screen04 from "../assets/water-images/screen-04.webp";
import screen04Dark from "../assets/water-images/screen-04-dark.webp";

export const featureSections = [
  {
    id: "monitoring",
    chip: "实时监测",
    title: "地图总览与监测点位",
    desc: "界面以 GIS 地图为核心，集中展示各区域监测站点的分布与实时状态。支持按区域、类型筛选，点击点位即可快速查看站点详情，形成可协同查看的整体监测视图。",
    image: screen01,
    imageDark: screen01Dark,
  },
  {
    id: "alert",
    chip: "智能预警",
    title: "站点详情",
    desc: "站点详情页可查看站点基本信息、设备报警列表及 AI 智能预测结果。支持对预警事件进行追溯与处置跟踪，为运维决策提供数据支撑。",
    image: screen02,
    imageDark: screen02Dark,
  },
  {
    id: "visualization",
    chip: "远程运维",
    title: "远程运维",
    desc: "支持对站点设备进行远程控制与运维操作，无需现场即可完成设备参数调整、启停控制等操作，提升运维效率、降低现场作业成本。",
    image: screen03,
    imageDark: screen03Dark,
  },
  {
    id: "integration",
    chip: "设备管理",
    title: "设备管理",
    desc: "集中展示所有监测设备的当前数值、运行状态及历史数据。支持按设备类型、站点筛选，支持趋势回溯与异常排查，实现设备全生命周期管理。",
    image: screen04,
    imageDark: screen04Dark,
  },
];
