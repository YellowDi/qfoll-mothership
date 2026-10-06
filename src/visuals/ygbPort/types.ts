/**
 * [INPUT]: 依赖 ./iso 的 Ctx/Iso，./palette 的 Palette/ThemeColors
 * [OUTPUT]: 对外提供 StaticItem 静态物件契约、DynamicItem 动态物件、WorldBox 世界包围盒、SurfacePainter 地面绘制函数、AddItem 物件收集器、VehicleType、VehicleLook 车辆外观入参、ParkedVehicle 停放车辆 (配图读取)
 * [POS]: visuals/ygbPort 的跨模块数据契约：structures/vehicles 生产静态物件，scene 烘焙与排序消费，figures 读取其中的停放车辆；放在这里避免这些模块互相引用类型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Ctx, Iso } from "./iso";
import type { Palette, ThemeColors } from "./palette";

/* 地面层绘制函数：city/terminal 各自收集，由 ground 在静态地面烘焙时依次调用 */
export type SurfacePainter = (ctx: Ctx, iso: Iso, c: Palette, dark: boolean) => void;

/* 物件收集器 (city/terminal 的 add)：接受任意个物件或物件数组，返回收集器当前的物件总数 */
export type AddItem = (...items: Array<StaticItem | StaticItem[]>) => number;

/* 停放车辆：静态物件里的车辆数据，配图为其补稳定编号与停放地点后读取 */
export interface ParkedVehicle extends VehicleLook {
  id: number;
  parked: true;
  where: "park" | "dock" | "port";
  /* 速度，停放恒为 0 */
  v: number;
}

/* 世界包围盒 [x0, y0, z0, x1, y1, z1]：船与岸桥的 bounds() 返回，场景据此裁切精灵 */
export type WorldBox = [number, number, number, number, number, number];

/* 交通输出的动态物件 (车辆/道闸/信号灯)：按 depth 与静态物件一起排序后调用 draw */
export interface DynamicItem {
  kind: "vehicle" | "barrier" | "signal";
  depth: number;
  y: number;
  px?: number;
  py?: number;
  draw: (ctx: Ctx) => void;
}

export type VehicleType = "truck" | "tractor" | "car" | "van" | "stacker";

/* 车辆外观所需的最小状态：行驶车辆 (traffic) 与停放车辆 (city/terminal) 共用 */
export interface VehicleLook {
  type: VehicleType;
  x: number;
  y: number;
  /* 朝向 (弧度) */
  h: number;
  /* 集装箱色索引；null/缺省为空车 */
  cargo?: number | null;
  /* 车身色索引 (社会车) */
  color?: number;
  /* 车头色索引 (集卡/拖车) */
  cab?: number;
  braking?: boolean;
  parked?: boolean;
  /* 停放车辆的停放地点 (配图补充)：park 停车场待命 / dock 仓库月台装卸 / port 港区内 */
  where?: "park" | "dock" | "port";
}

/*
 * 静态物件契约：世界包围盒 + 排序深度 + 绘制函数。
 * shadow 白天画在统一阴影层 (锐利多边形)，场景整体模糊一次再叠到地面；light 在夜间写入光照图；
 * beacon 为塔顶航标位置；pad 为精灵外扩 (默认 3，带光晕的灯具更大)；vehicle 保留停放车辆数据供配图读取。
 */
export interface StaticItem {
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  depth: number;
  draw: (ctx: Ctx, iso: Iso, c: Palette, dark: boolean, colors: ThemeColors) => void;
  shadow?: (ctx: Ctx, iso: Iso, c: Palette) => void;
  light?: (ctx: Ctx, iso: Iso, c: Palette) => void;
  beacon?: [number, number, number];
  pad?: number;
  vehicle?: VehicleLook;
}
