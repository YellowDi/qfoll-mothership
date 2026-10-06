/**
 * [INPUT]: 依赖 roadNetwork 几何图与 Canvas、可见性、设备像素比
 * [OUTPUT]: 对外提供 mountRoadMap，挂载原路线图动画并返回生命周期清理函数 (canvas 尺寸为零时仍返回清理函数)
 * [POS]: 路线图绘制边界，统一背景算法与帧率策略
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import {
  createRoadNetwork,
  type BuildingPoly,
  type Neighbor,
  type ParkPlot,
  type Point,
  type RoadEdge,
  type RoadNetwork,
  type RoadNode,
} from "./roadNetwork";

/* 货车沿边运动：progress 为当前边上的归一化进度，到头后由 chooseNextNode 选下一条边 */
interface Truck {
  edgeKey: string;
  from: string;
  to: string;
  progress: number;
  speed: number;
  pulsePhase: number;
  pulseFreq: number;
}

export function mountRoadMap(canvas: HTMLCanvasElement): () => void {
  const BASE_COLS = 14;
  const BASE_ROWS = 10;
  const BASE_TRUCK_COUNT = 10;
  const NETWORK_ROTATION = (15 * Math.PI) / 180;

  const BLINK_FPS = 24;
  const DEFAULT_FPS = 30;

  let ctx: CanvasRenderingContext2D | null | undefined;
  /* 三个几何函数随 createRoadNetwork 的结果在首次 resize() 中赋值，之后才会被绘制路径调用 */
  let quadraticPoint!: RoadNetwork["quadraticPoint"];
  let quadraticTangent!: RoadNetwork["quadraticTangent"];
  let polygonBounds!: RoadNetwork["polygonBounds"];
  let rafId = 0;
  let resizeObserver: ResizeObserver | undefined;
  let intersectionObserver: IntersectionObserver | undefined;
  let visibilityHandler: (() => void) | null | undefined;
  let dpr = 1;
  let width = 0;
  let height = 0;
  let lastTime = 0;
  let minFrameMs = 1000 / DEFAULT_FPS;
  let inViewport = true;
  let docVisible = true;
  let reduceMotion = false;

  let nodes: RoadNode[] = [];
  let edges: RoadEdge[] = [];
  let neighbors = new Map<string, Neighbor[]>();
  let trucks: Truck[] = [];
  let nodeLookup = new Map<string, RoadNode>();
  let edgeLookup = new Map<string, RoadEdge>();
  let parkPlots: ParkPlot[] = [];
  let buildingPolys: BuildingPoly[] = [];
  let waterPolys: Point[][] = [];
  let gridCols = BASE_COLS;
  let gridRows = BASE_ROWS;
  let staticCanvas: HTMLCanvasElement | null = null;
  let staticCtx: CanvasRenderingContext2D | null = null;

  const isBlink =
    typeof navigator !== "undefined" &&
    /AppleWebKit/i.test(navigator.userAgent) &&
    /(Chrome|Chromium|Edg|OPR)/i.test(navigator.userAgent);

  const pickRandomEdge = () => edges[Math.floor(Math.random() * edges.length)];

  const edgeByKey = (key: string) => edgeLookup.get(key);

  const spawnTrucks = () => {
    const areaFactor = Math.min(1.8, Math.max(0.9, (width * height) / (1100 * 620)));
    const densityFactor = isBlink ? 0.72 : 0.86;
    const truckCount = Math.max(8, Math.round(BASE_TRUCK_COUNT * areaFactor * densityFactor));
    const bridgeEdges = edges.filter((edge) => edge.bridge);
    const shuffledBridges = [...bridgeEdges].sort(() => Math.random() - 0.5);
    const onBridgeCount = Math.min(shuffledBridges.length, Math.max(3, Math.round(truckCount * 0.34)));
    const result: Truck[] = [];

    for (let i = 0; i < onBridgeCount; i += 1) {
      const edge = shuffledBridges[i];
      result.push({
        edgeKey: edge.key,
        from: edge.a,
        to: edge.b,
        progress: Math.random(),
        speed: 20 + Math.random() * 14,
        pulsePhase: Math.random(),
        pulseFreq: 0.55 + Math.random() * 0.4,
      });
    }

    for (let i = result.length; i < truckCount; i += 1) {
      const edge = pickRandomEdge();
      result.push({
        edgeKey: edge.key,
        from: edge.a,
        to: edge.b,
        progress: Math.random(),
        speed: 24 + Math.random() * 22,
        pulsePhase: Math.random(),
        pulseFreq: 0.55 + Math.random() * 0.4,
      });
    }

    trucks = result;
  };

  const chooseNextNode = (nodeId: string, prevNodeId: string): Neighbor | undefined => {
    const options = neighbors.get(nodeId) || [];
    const filtered = options.filter((item) => item.to !== prevNodeId);
    const pool = filtered.length > 0 ? filtered : options;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const updateTrucks = (dt: number) => {
    for (const truck of trucks) {
      const edge = edgeByKey(truck.edgeKey);
      if (!edge || edge.length < 1) continue;
      truck.progress += (truck.speed * dt) / edge.length;

      while (truck.progress >= 1) {
        const currentNode = truck.to;
        const prevNode = truck.from;
        const next = chooseNextNode(currentNode, prevNode);
        if (!next) break;
        truck.from = currentNode;
        truck.to = next.to;
        truck.edgeKey = next.edge;
        truck.progress -= 1;
      }
    }
  };

  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, targetCtx: CanvasRenderingContext2D = ctx!) => {
    targetCtx.beginPath();
    targetCtx.moveTo(x + r, y);
    targetCtx.lineTo(x + w - r, y);
    targetCtx.quadraticCurveTo(x + w, y, x + w, y + r);
    targetCtx.lineTo(x + w, y + h - r);
    targetCtx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    targetCtx.lineTo(x + r, y + h);
    targetCtx.quadraticCurveTo(x, y + h, x, y + h - r);
    targetCtx.lineTo(x, y + r);
    targetCtx.quadraticCurveTo(x, y, x + r, y);
    targetCtx.closePath();
  };

  const drawParkShape = (points: Point[] | null | undefined, targetCtx: CanvasRenderingContext2D = ctx!) => {
    if (!points || points.length < 4) return;
    targetCtx.beginPath();
    targetCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      targetCtx.lineTo(points[i].x, points[i].y);
    }
    targetCtx.closePath();
  };

  const drawPoly = (points: Point[] | null | undefined, targetCtx: CanvasRenderingContext2D = ctx!) => {
    if (!points || points.length < 3) return;
    targetCtx.beginPath();
    targetCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      targetCtx.lineTo(points[i].x, points[i].y);
    }
    targetCtx.closePath();
  };

  const drawEdgePath = (edge: RoadEdge, targetCtx: CanvasRenderingContext2D = ctx!) => {
    const a = nodeLookup.get(edge.a);
    const b = nodeLookup.get(edge.b);
    if (!a || !b) return false;
    targetCtx.beginPath();
    targetCtx.moveTo(a.x, a.y);
    targetCtx.quadraticCurveTo(edge.cx, edge.cy, b.x, b.y);
    return true;
  };

  const drawBridgeRamp = (bridgeEdge: RoadEdge, nodeId: string, targetCtx: CanvasRenderingContext2D = ctx!) => {
    const node = nodeLookup.get(nodeId);
    if (!node) return false;
    const links = (neighbors.get(nodeId) || []).filter(
      (item) => item.edge !== bridgeEdge.key && !edgeLookup.get(item.edge)?.bridge
    );
    if (!links.length) return false;
    const landEdge = edgeLookup.get(links[0].edge);
    if (!landEdge) return false;
    const isStart = landEdge.a === nodeId;
    const other = nodeLookup.get(isStart ? landEdge.b : landEdge.a);
    if (!other) return false;
    const t = isStart ? 0.18 : 0.82;
    const px = quadraticPoint(
      node.x,
      isStart ? landEdge.cx : landEdge.cx,
      other.x,
      t
    );
    const py = quadraticPoint(
      node.y,
      isStart ? landEdge.cy : landEdge.cy,
      other.y,
      t
    );
    targetCtx.beginPath();
    targetCtx.moveTo(node.x, node.y);
    targetCtx.lineTo(px, py);
    return true;
  };

  const applyNetworkTransform = (targetCtx: CanvasRenderingContext2D) => {
    const cos = Math.abs(Math.cos(NETWORK_ROTATION));
    const sin = Math.abs(Math.sin(NETWORK_ROTATION));
    const scaleX = (cos * width + sin * height) / width;
    const scaleY = (sin * width + cos * height) / height;
    const coverScale = Math.max(scaleX, scaleY) * 1.08;
    targetCtx.translate(width * 0.5, height * 0.5);
    targetCtx.rotate(NETWORK_ROTATION);
    targetCtx.scale(coverScale, coverScale);
    targetCtx.translate(-width * 0.5, -height * 0.5);
  };

  const getSafeDpr = () => {
    const raw = window.devicePixelRatio || 1;
    return isBlink ? Math.min(raw, 1.5) : Math.min(raw, 2);
  };

  const renderStaticLayer = () => {
    if (!staticCtx || !width || !height) return;
    staticCtx.clearRect(0, 0, width, height);
    staticCtx.save();
    applyNetworkTransform(staticCtx);

    for (const water of waterPolys) {
      const bounds = polygonBounds(water);
      const waterGradient = staticCtx.createLinearGradient(
        bounds.minX,
        bounds.minY,
        bounds.maxX,
        bounds.maxY
      );
      waterGradient.addColorStop(0, "rgba(132, 196, 232, 0.24)");
      waterGradient.addColorStop(0.55, "rgba(104, 181, 224, 0.3)");
      waterGradient.addColorStop(1, "rgba(80, 166, 214, 0.24)");
      staticCtx.fillStyle = waterGradient;
      staticCtx.strokeStyle = "rgba(102, 171, 212, 0.26)";
      staticCtx.lineWidth = 1;
      drawPoly(water, staticCtx);
      staticCtx.fill();
      staticCtx.stroke();
    }

    for (const park of parkPlots) {
      staticCtx.fillStyle = "rgba(118, 184, 108, 0.34)";
      staticCtx.strokeStyle = "rgba(86, 150, 82, 0.42)";
      staticCtx.lineWidth = 1;
      drawParkShape(park.points, staticCtx);
      staticCtx.fill();
      staticCtx.stroke();
    }

    for (const building of buildingPolys) {
      staticCtx.save();
      staticCtx.translate(building.cx, building.cy);
      staticCtx.rotate(building.rot);
      staticCtx.translate(-building.cx, -building.cy);
      staticCtx.fillStyle = "rgba(164, 175, 188, 0.32)";
      staticCtx.strokeStyle = "rgba(130, 144, 160, 0.34)";
      staticCtx.lineWidth = 0.8;
      drawPoly(building.points, staticCtx);
      staticCtx.fill();
      staticCtx.stroke();
      staticCtx.restore();
    }

    staticCtx.strokeStyle = "rgba(90, 120, 156, 0.2)";
    staticCtx.lineWidth = 1.35;
    staticCtx.lineCap = "round";
    staticCtx.lineJoin = "round";
    for (const edge of edges) {
      if (!drawEdgePath(edge, staticCtx)) continue;
      staticCtx.stroke();
    }

    staticCtx.strokeStyle = "rgba(67, 107, 155, 0.31)";
    staticCtx.lineWidth = 2.4;
    for (const edge of edges) {
      if (!edge.major) continue;
      if (!drawEdgePath(edge, staticCtx)) continue;
      staticCtx.stroke();
    }

    for (const edge of edges) {
      if (!edge.bridge) continue;
      staticCtx.strokeStyle = "rgba(235, 245, 252, 0.82)";
      staticCtx.lineWidth = 3.8;
      if (!drawEdgePath(edge, staticCtx)) continue;
      staticCtx.stroke();

      staticCtx.strokeStyle = "rgba(98, 133, 165, 0.82)";
      staticCtx.lineWidth = 2.2;
      if (!drawEdgePath(edge, staticCtx)) continue;
      staticCtx.stroke();
    }

    for (const edge of edges) {
      if (!edge.bridge) continue;
      staticCtx.strokeStyle = "rgba(235, 245, 252, 0.78)";
      staticCtx.lineWidth = 3;
      if (drawBridgeRamp(edge, edge.a, staticCtx)) staticCtx.stroke();
      if (drawBridgeRamp(edge, edge.b, staticCtx)) staticCtx.stroke();

      staticCtx.strokeStyle = "rgba(98, 133, 165, 0.78)";
      staticCtx.lineWidth = 1.8;
      if (drawBridgeRamp(edge, edge.a, staticCtx)) staticCtx.stroke();
      if (drawBridgeRamp(edge, edge.b, staticCtx)) staticCtx.stroke();
    }

    staticCtx.restore();
  };

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (staticCanvas) {
      ctx.drawImage(staticCanvas, 0, 0, width, height);
    }

    ctx.save();
    applyNetworkTransform(ctx);

    for (const truck of trucks) {
      const edge = edgeByKey(truck.edgeKey);
      if (!edge) continue;
      const a = nodeLookup.get(truck.from);
      const b = nodeLookup.get(truck.to);
      if (!a || !b) continue;
      const t = truck.progress;
      const x = quadraticPoint(a.x, edge.cx, b.x, t);
      const y = quadraticPoint(a.y, edge.cy, b.y, t);
      const tx = quadraticTangent(a.x, edge.cx, b.x, t);
      const ty = quadraticTangent(a.y, edge.cy, b.y, t);
      const angle = Math.atan2(ty, tx);
      const pulseT = ((lastTime * 0.001 * truck.pulseFreq) + truck.pulsePhase) % 1;
      const pulseR = 8 + pulseT * 20;
      ctx.strokeStyle = `rgba(254,131,72,${0.34 * (1 - pulseT)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.shadowColor = "rgba(254,131,72,0.22)";
      ctx.shadowBlur = isBlink ? 4 : 2.5;
      drawRoundedRect(-7, -4, 14, 8, 2.5);
      ctx.fillStyle = "#fe8348";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.86)";
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      drawRoundedRect(1, -3, 5, 6, 1.6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.restore();
    }
    ctx.restore();
  };

  const frame = (time: number) => {
    if (!lastTime) lastTime = time;
    const elapsed = time - lastTime;
    if (elapsed >= minFrameMs) {
      const dt = Math.min(elapsed / 1000, 0.05);
      lastTime = time;
      updateTrucks(dt);
      draw();
    }
    rafId = requestAnimationFrame(frame);
  };

  const startLoop = () => {
    if (rafId) return;
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  };

  const stopLoop = () => {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const updateLoopState = () => {
    if (inViewport && docVisible && !reduceMotion) {
      startLoop();
    } else {
      stopLoop();
      draw();
    }
  };

  const resize = () => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = getSafeDpr();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    staticCanvas = document.createElement("canvas");
    staticCanvas.width = Math.round(width * dpr);
    staticCanvas.height = Math.round(height * dpr);
    staticCtx = staticCanvas.getContext("2d");
    if (staticCtx) {
      staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ({ nodes, edges, neighbors, nodeLookup, edgeLookup, parkPlots, buildingPolys, waterPolys, quadraticPoint, quadraticTangent, polygonBounds } = createRoadNetwork(width, height));
    spawnTrucks();
    renderStaticLayer();
    draw();
  };


  minFrameMs = 1000 / (isBlink ? BLINK_FPS : DEFAULT_FPS);
  docVisible = !document.hidden;
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resize();
  resizeObserver = new ResizeObserver(() => resize());
  if (canvas) resizeObserver.observe(canvas);
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      inViewport = entries.some((entry) => entry.isIntersecting);
      updateLoopState();
    },
    { threshold: 0.01 }
  );
  if (canvas) intersectionObserver.observe(canvas);
  visibilityHandler = () => {
    docVisible = !document.hidden;
    updateLoopState();
  };
  document.addEventListener("visibilitychange", visibilityHandler);
  updateLoopState();
  return () => {
    stopLoop();
    if (resizeObserver) resizeObserver.disconnect();
    if (intersectionObserver) intersectionObserver.disconnect();
    if (visibilityHandler) {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }
    staticCanvas = null;
    staticCtx = null;
  };
}
