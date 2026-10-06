/**
 * [INPUT]: 依赖 ../layout 的分区常量、../traffic 的 plateOf
 * [OUTPUT]: 对外提供 zoneOf 位置语义、clock 业务时钟、isTruck 集卡判定、inTruckPark、parkedTrucks 停放集卡 (含停放地点)、plateOf
 * [POS]: figures 的共享语义层；各配图对"集卡在哪、几点了、车牌是什么"保持同一口径
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FENCE_Y, GATE, MAIN_ROAD } from "../layout";
import type { PortScene } from "../scene";
import { plateOf } from "../traffic";
import type { ParkedVehicle, VehicleLook } from "../types";

export { plateOf };

/* 位置语义：港口只关心闸口进出，其余都是集卡视角的道路与场站 */
export function zoneOf(x: number, y: number): string {
  if (y > 236) return "码头前沿";
  if (y > -158) return "港区堆场";
  if (y > FENCE_Y) return Math.abs(x - GATE.x) < 40 ? "港区闸口" : "港区内道路";
  if (y > MAIN_ROAD.y - MAIN_ROAD.half - 2) return "疏港大道";
  return "城区道路";
}

/* 业务时钟：从 08:30 起，世界 1 秒折算 4 秒 */
export function clock(t: number): string {
  const m = 8 * 60 + 30 + (t * 4) / 60;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
}

/* 云柜宝只服务社会集卡：港内拖车属于码头设备，不进入任何配图 */
export const isTruck = (v: Pick<VehicleLook, "type">) => v.type === "truck";

/* 集卡停车场范围：与 city 中停车场街坊一致 */
export const inTruckPark = (x: number, y: number) => x > -648 && x < -372 && y > -608 && y < -321;

/* 停放集卡：来自静态物件，补稳定编号 (车牌) 与停放地点：停车场待命 / 仓库月台装卸 / 港区内 */
export function parkedTrucks(scene: PortScene): ParkedVehicle[] {
  scene.parkedCache ??= scene.statics.filter((o) => o.vehicle?.type === "truck").map((o) => {
    const v = o.vehicle!;
    const where = inTruckPark(v.x, v.y) ? "park" : v.y > FENCE_Y ? "port" : "dock";
    return { ...v, id: 500 + (Math.abs(Math.round(v.x * 7 + v.y * 13)) % 4000), parked: true as const, where, v: 0 };
  });
  return scene.parkedCache;
}
