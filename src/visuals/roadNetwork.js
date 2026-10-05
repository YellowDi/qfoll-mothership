/**
 * [INPUT]: 依赖容器宽高，使用原云柜宝路线图的确定性几何算法
 * [OUTPUT]: 对外提供 createRoadNetwork，返回路网、桥梁、水系、建筑与几何函数
 * [POS]: 框架无关的地图几何层，被 Vue 与 React 共用的 Canvas 引擎消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export function createRoadNetwork(width, height) {
const BASE_COLS = 14;
const BASE_ROWS = 10;
const TARGET_GRID_POINTS = BASE_COLS * BASE_ROWS;
let nodes = [], edges = [], parkPlots = [], buildingPolys = [], waterPolys = [];
let neighbors = new Map(), nodeLookup = new Map(), edgeLookup = new Map();
let gridCols = BASE_COLS, gridRows = BASE_ROWS;
const seeded = (n) => {
  const x = Math.sin(n * 127.1) * 43758.5453123;
  return x - Math.floor(x);
};

const getNodeId = (r, c) => `${r}-${c}`;

const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const majorEdge = (r, c, type, rows, cols) => {
  const majorRows = new Set([1, Math.floor(rows / 2), rows - 2]);
  const majorCols = new Set([2, Math.floor(cols * 0.58), cols - 3]);
  if (type === "h") return majorRows.has(r);
  return majorCols.has(c);
};

const buildAnchors = (count, size, seedBase) => {
  const weights = [];
  let total = 0;
  for (let i = 0; i < count - 1; i += 1) {
    const w = 0.82 + seeded(seedBase + i * 17) * 0.52;
    weights.push(w);
    total += w;
  }
  const anchors = [0];
  let acc = 0;
  for (let i = 0; i < weights.length; i += 1) {
    acc += (weights[i] / total) * size;
    anchors.push(acc);
  }
  return anchors;
};

const quadraticPoint = (a, c, b, t) => {
  const mt = 1 - t;
  return (
    mt * mt * a +
    2 * mt * t * c +
    t * t * b
  );
};

const quadraticTangent = (a, c, b, t) => {
  return 2 * (1 - t) * (c - a) + 2 * t * (b - c);
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const pointToward = (from, to, ratio) => ({
  x: from.x + (to.x - from.x) * ratio,
  y: from.y + (to.y - from.y) * ratio,
});

const polygonBounds = (points) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-6) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const pointSegmentDistance = (p, a, b) => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 > 0 ? clamp((apx * abx + apy * aby) / ab2, 0, 1) : 0;
  const x = a.x + abx * t;
  const y = a.y + aby * t;
  return Math.hypot(p.x - x, p.y - y);
};

const pointToPolygonEdgeDistance = (point, polygon) => {
  let min = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    min = Math.min(min, pointSegmentDistance(point, a, b));
  }
  return min;
};

const createIrregularRect = (x, y, w, h, seedBase) => {
  const cutTL = clamp(0.08 + seeded(seedBase + 1) * 0.2, 0.05, 0.28);
  const cutTR = clamp(0.08 + seeded(seedBase + 2) * 0.2, 0.05, 0.28);
  const cutBR = clamp(0.08 + seeded(seedBase + 3) * 0.2, 0.05, 0.28);
  const cutBL = clamp(0.08 + seeded(seedBase + 4) * 0.2, 0.05, 0.28);
  return [
    { x: x + w * cutTL, y },
    { x: x + w * (1 - cutTR), y },
    { x: x + w, y: y + h * cutTR * 0.9 },
    { x: x + w, y: y + h * (1 - cutBR) },
    { x: x + w * (1 - cutBR * 0.9), y: y + h },
    { x: x + w * cutBL, y: y + h },
    { x, y: y + h * (1 - cutBL * 0.9) },
    { x, y: y + h * cutTL },
  ];
};

const createRiverPolygon = (seedBase, yBaseRatio, thickness, waveAmp) => {
  const pointsTop = [];
  const pointsBottom = [];
  const steps = 22;
  const baseY = height * yBaseRatio;
  const phaseA = seeded(seedBase + 11) * Math.PI * 2;
  const phaseB = seeded(seedBase + 29) * Math.PI * 2;
  // On portrait screens, slightly increase vertical amplitude/thickness
  // to avoid rivers looking squeezed.
  const aspect = width / Math.max(height, 1);
  const yComp = aspect < 0.82 ? 1.18 : 1;
  const riverThickness = thickness * yComp;
  const riverWaveAmp = waveAmp * yComp;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = -width * 0.2 + t * width * 1.4;
    const noiseA = Math.sin(t * Math.PI * 2.2 + phaseA) * riverWaveAmp;
    const noiseB = Math.sin(t * Math.PI * 4.1 + phaseB) * (riverWaveAmp * 0.55);
    const y = baseY + noiseA + noiseB;
    pointsTop.push({ x, y: y - riverThickness * 0.5 });
    pointsBottom.push({ x, y: y + riverThickness * 0.5 });
  }
  return [...pointsTop, ...pointsBottom.reverse()];
};

const buildNetwork = () => {
  nodes = [];
  edges = [];
  neighbors = new Map();
  nodeLookup = new Map();
  edgeLookup = new Map();
  parkPlots = [];
  buildingPolys = [];
  waterPolys = [];

  const aspect = width / Math.max(height, 1);
  gridCols = clamp(Math.round(Math.sqrt(TARGET_GRID_POINTS * aspect)), 9, 18);
  gridRows = clamp(Math.round(TARGET_GRID_POINTS / Math.max(gridCols, 1)), 8, 16);

  const xAnchors = buildAnchors(gridCols, width, 31);
  const yAnchors = buildAnchors(gridRows, height, 73);
  const xGap = width / Math.max(gridCols - 1, 1);
  const yGap = height / Math.max(gridRows - 1, 1);

  for (let r = 0; r < gridRows; r += 1) {
    for (let c = 0; c < gridCols; c += 1) {
      const n = r * gridCols + c + 1;
      const jitterX = (seeded(n * 11) - 0.5) * xGap * 0.14;
      const jitterY = (seeded(n * 19) - 0.5) * yGap * 0.14;
      // Row/column wave offsets break rigid vertical/horizontal alignment.
      const waveX =
        Math.sin((r / Math.max(1, gridRows - 1)) * Math.PI * 1.72 + seeded((c + 1) * 41) * Math.PI * 2) *
        xGap *
        0.16;
      const waveY =
        Math.sin((c / Math.max(1, gridCols - 1)) * Math.PI * 1.33 + seeded((r + 1) * 29) * Math.PI * 2) *
        yGap *
        0.1;
      const x = xAnchors[c] + jitterX + waveX;
      const y = yAnchors[r] + jitterY + waveY;
      const node = { id: getNodeId(r, c), r, c, x, y };
      nodes.push(node);
      nodeLookup.set(node.id, node);
    }
  }

  const createEdgeObject = (idA, idB, major = false) => {
    const key = edgeKey(idA, idB);
    const a = nodeLookup.get(idA);
    const b = nodeLookup.get(idB);
    if (!a || !b) return null;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const nx = length > 0 ? -dy / length : 0;
    const ny = length > 0 ? dx / length : 0;
    const bendSeed = seeded((a.r + 1) * 97 + (a.c + 1) * 53 + (b.r + 1) * 13 + (b.c + 1) * 29);
    const bend = (bendSeed - 0.5) * Math.min(18, length * 0.09);
    const cx = midX + nx * bend;
    const cy = midY + ny * bend;
    return { key, a: idA, b: idB, length, major, cx, cy };
  };

  const exists = new Set();
  const addEdge = (idA, idB, major = false) => {
    const key = edgeKey(idA, idB);
    if (exists.has(key)) return;
    exists.add(key);
    const edge = createEdgeObject(idA, idB, major);
    if (!edge) return;
    edges.push(edge);
    edgeLookup.set(key, edge);
    if (!neighbors.has(idA)) neighbors.set(idA, []);
    if (!neighbors.has(idB)) neighbors.set(idB, []);
    neighbors.get(idA).push({ to: idB, edge: key });
    neighbors.get(idB).push({ to: idA, edge: key });
  };

  waterPolys.push(createRiverPolygon(401, 0.24, Math.max(26, height * 0.085), Math.max(10, height * 0.032)));

  for (let r = 0; r < gridRows; r += 1) {
    for (let c = 0; c < gridCols; c += 1) {
      const id = getNodeId(r, c);
      const hMajor = majorEdge(r, c, "h", gridRows, gridCols);
      const vMajor = majorEdge(r, c, "v", gridRows, gridCols);
      if (c < gridCols - 1 && (hMajor || seeded((r + 1) * (c + 2) * 21) > 0.01)) {
        addEdge(id, getNodeId(r, c + 1), hMajor);
      }
      if (r < gridRows - 1 && (vMajor || seeded((r + 3) * (c + 1) * 27) > 0.01)) {
        addEdge(id, getNodeId(r + 1, c), vMajor);
      }
      // Keep diagonal links sparse to avoid sharp/acute junctions.
      if (r < gridRows - 1 && c < gridCols - 1 && seeded((r + 1) * (c + 3) * 7) > 0.988) {
        addEdge(id, getNodeId(r + 1, c + 1), false);
      }
      if (r > 0 && c < gridCols - 1 && seeded((r + 5) * (c + 2) * 9) > 0.992) {
        addEdge(id, getNodeId(r - 1, c + 1), false);
      }
    }
  }

  const pointInAnyWater = (point, bank = 0) => {
    for (const water of waterPolys) {
      if (pointInPolygon(point, water)) return true;
      if (bank > 0 && pointToPolygonEdgeDistance(point, water) <= bank) return true;
    }
    return false;
  };

  const edgeWaterProfile = (edge) => {
    const a = nodeLookup.get(edge.a);
    const b = nodeLookup.get(edge.b);
    if (!a || !b) return { cross: false, waterIndex: -1, ratio: 0 };
    const sampleCount = 12;
    const hits = new Array(waterPolys.length).fill(0);
    for (let i = 0; i <= sampleCount; i += 1) {
      const t = i / sampleCount;
      const p = {
        x: quadraticPoint(a.x, edge.cx, b.x, t),
        y: quadraticPoint(a.y, edge.cy, b.y, t),
      };
      for (let wi = 0; wi < waterPolys.length; wi += 1) {
        if (pointInPolygon(p, waterPolys[wi])) hits[wi] += 1;
      }
    }
    let bestIndex = -1;
    let bestHit = 0;
    for (let wi = 0; wi < hits.length; wi += 1) {
      if (hits[wi] > bestHit) {
        bestHit = hits[wi];
        bestIndex = wi;
      }
    }
    return {
      cross: bestHit > 0,
      waterIndex: bestIndex,
      ratio: bestHit / (sampleCount + 1),
    };
  };

  // Keep all land edges, then add bridge edges whose both ends already belong to land network.
  const landEdges = [];
  const crossEdgesByWater = waterPolys.map(() => []);
  edges.forEach((edge, idx) => {
    const profile = edgeWaterProfile(edge);
    if (!profile.cross) {
      landEdges.push(edge);
      return;
    }
    if (profile.waterIndex >= 0) crossEdgesByWater[profile.waterIndex].push({ edge, profile, idx });
  });

  const landDegree = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of landEdges) {
    landDegree.set(edge.a, (landDegree.get(edge.a) || 0) + 1);
    landDegree.set(edge.b, (landDegree.get(edge.b) || 0) + 1);
  }

  const keptEdges = [...landEdges];
  const keptKeys = new Set(landEdges.map((edge) => edge.key));
  const bridgeQuota = waterPolys.map(() => 0);
  const bridgeTarget = waterPolys.map(() => 4);

  const isMostlyNorthSouth = (edge) => {
    const a = nodeLookup.get(edge.a);
    const b = nodeLookup.get(edge.b);
    if (!a || !b) return false;
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx < Math.max(18, dy * 0.32);
  };

  const hasLandConnection = (nodeId) => (landDegree.get(nodeId) || 0) > 0;

  const addBridgeEdge = (edge, wi) => {
    if (!edge || keptKeys.has(edge.key)) return false;
    edge.bridge = true;
    edge.bridgeWater = wi;
    keptEdges.push(edge);
    keptKeys.add(edge.key);
    bridgeQuota[wi] += 1;
    return true;
  };

  // Prefer existing crossing edges that are clearly north-south and already connected on both ends.
  for (let wi = 0; wi < crossEdgesByWater.length; wi += 1) {
    const candidates = crossEdgesByWater[wi]
      .filter(({ edge }) => isMostlyNorthSouth(edge) && hasLandConnection(edge.a) && hasLandConnection(edge.b))
      .map(({ edge, profile, idx }) => {
        const a = nodeLookup.get(edge.a);
        const b = nodeLookup.get(edge.b);
        const midX = a && b ? (a.x + b.x) * 0.5 : 0;
        const score =
          (edge.major ? 2.2 : 0.8) +
          edge.length * 0.012 +
          (1 - profile.ratio) * 1.4 +
          seeded((idx + 1) * 31);
        return { edge, midX, score };
      })
      .sort((a, b) => b.score - a.score);

    const pickedMidXs = [];
    for (const candidate of candidates) {
      if (bridgeQuota[wi] >= bridgeTarget[wi]) break;
      if (pickedMidXs.some((x) => Math.abs(x - candidate.midX) < width * 0.06)) continue;
      if (addBridgeEdge(candidate.edge, wi)) pickedMidXs.push(candidate.midX);
    }
  }

  const ensureBridgeAcrossWater = (water, wi, targetX, strict = true) => {
    const bounds = polygonBounds(water);
    const waterCenterY = (bounds.minY + bounds.maxY) * 0.5;
    const bankPad = 6;
    const northCandidates = nodes
      .filter((n) => {
        if (n.y >= waterCenterY - bankPad) return false;
        if (pointInAnyWater({ x: n.x, y: n.y }, bankPad)) return false;
        return strict ? hasLandConnection(n.id) : true;
      })
      .sort(
        (a, b) =>
          Math.abs(a.x - targetX) + Math.abs(a.y - waterCenterY) * 0.35 -
          (Math.abs(b.x - targetX) + Math.abs(b.y - waterCenterY) * 0.35)
      )
      .slice(0, 18);
    const southCandidates = nodes
      .filter((n) => {
        if (n.y <= waterCenterY + bankPad) return false;
        if (pointInAnyWater({ x: n.x, y: n.y }, bankPad)) return false;
        return strict ? hasLandConnection(n.id) : true;
      })
      .sort(
        (a, b) =>
          Math.abs(a.x - targetX) + Math.abs(a.y - waterCenterY) * 0.35 -
          (Math.abs(b.x - targetX) + Math.abs(b.y - waterCenterY) * 0.35)
      )
      .slice(0, 18);
    if (!northCandidates.length || !southCandidates.length) return false;

    let picked = null;
    let best = Infinity;
    for (const n of northCandidates) {
      for (const s of southCandidates) {
        const dxNS = Math.abs(n.x - s.x);
        const dyNS = Math.abs(n.y - s.y);
        if (dyNS < height * 0.12 || dyNS > height * 0.64) continue;
        if (dxNS > width * 0.12) continue;
        const candidateEdge = createEdgeObject(n.id, s.id, true);
        if (!candidateEdge || !isMostlyNorthSouth(candidateEdge)) continue;
        const profile = edgeWaterProfile(candidateEdge);
        if (!profile.cross || profile.waterIndex !== wi) continue;
        const score =
          Math.abs(((n.x + s.x) * 0.5) - targetX) +
          dyNS * 0.16 +
          dxNS * 0.9 +
          Math.abs(profile.ratio - 0.22) * 120;
        if (score < best) {
          best = score;
          picked = { edge: candidateEdge };
        }
      }
    }
    if (!picked) return false;

    return addBridgeEdge(picked.edge, wi);
  };

  // Ensure south bank is linked well: target multiple north-south bridges each water body.
  for (let wi = 0; wi < waterPolys.length; wi += 1) {
    const water = waterPolys[wi];
    const bounds = polygonBounds(water);
    const span = bounds.maxX - bounds.minX;
    const targets = [
      bounds.minX + span * 0.2,
      bounds.minX + span * 0.38,
      bounds.minX + span * 0.56,
      bounds.minX + span * 0.76,
    ];
    for (const target of targets) {
      if (bridgeQuota[wi] >= 4) break;
      if (!ensureBridgeAcrossWater(water, wi, target, true)) {
        ensureBridgeAcrossWater(water, wi, target, false);
      }
    }
  }

  edges = keptEdges;
  edgeLookup = new Map(edges.map((e) => [e.key, e]));
  neighbors = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    neighbors.get(edge.a)?.push({ to: edge.b, edge: edge.key });
    neighbors.get(edge.b)?.push({ to: edge.a, edge: edge.key });
  }

  const addFinalEdge = (edge) => {
    if (!edge || edgeLookup.has(edge.key)) return false;
    edges.push(edge);
    edgeLookup.set(edge.key, edge);
    neighbors.get(edge.a)?.push({ to: edge.b, edge: edge.key });
    neighbors.get(edge.b)?.push({ to: edge.a, edge: edge.key });
    return true;
  };

  const connectBridgeToBankRoad = (bridgeEdge, nodeId, waterIndex) => {
    const node = nodeLookup.get(nodeId);
    const water = waterPolys[waterIndex];
    if (!node || !water) return;
    const maxDist = Math.max(width, height) * 0.35;
    const candidates = nodes
      .filter((n) => {
        if (n.id === nodeId) return false;
        if (pointInAnyWater({ x: n.x, y: n.y }, 4)) return false;
        const dist = Math.hypot(n.x - node.x, n.y - node.y);
        if ((neighbors.get(n.id)?.length || 0) < 1) return false;
        return dist <= maxDist;
      })
      .sort((a, b) => {
        const da = Math.hypot(a.x - node.x, a.y - node.y);
        const db = Math.hypot(b.x - node.x, b.y - node.y);
        return da - db;
      })
      .slice(0, 36);

    for (const candidate of candidates) {
      const connector = createEdgeObject(nodeId, candidate.id, false);
      if (!connector) continue;
      const profile = edgeWaterProfile(connector);
      if (profile.cross) continue;
      connector.connector = true;
      if (addFinalEdge(connector)) return;
    }
  };

  // Prevent dead-end bridges: ensure both ends connect back to non-bridge land network.
  for (const edge of edges.filter((item) => item.bridge)) {
    if (edge.bridgeWater == null) continue;
    const nonBridgeDegreeA =
      (neighbors.get(edge.a) || []).filter((item) => !edgeLookup.get(item.edge)?.bridge).length;
    const nonBridgeDegreeB =
      (neighbors.get(edge.b) || []).filter((item) => !edgeLookup.get(item.edge)?.bridge).length;
    if (nonBridgeDegreeA < 1) connectBridgeToBankRoad(edge, edge.a, edge.bridgeWater);
    if (nonBridgeDegreeB < 1) connectBridgeToBankRoad(edge, edge.b, edge.bridgeWater);
  }

  // Last resort: drop any still-dead-end bridge so UI never shows isolated bridge stubs.
  edges = edges.filter((edge) => {
    if (!edge.bridge) return true;
    const nonBridgeDegreeA =
      (neighbors.get(edge.a) || []).filter((item) => !edgeLookup.get(item.edge)?.bridge).length;
    const nonBridgeDegreeB =
      (neighbors.get(edge.b) || []).filter((item) => !edgeLookup.get(item.edge)?.bridge).length;
    return nonBridgeDegreeA > 0 && nonBridgeDegreeB > 0;
  });
  edgeLookup = new Map(edges.map((e) => [e.key, e]));
  neighbors = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    neighbors.get(edge.a)?.push({ to: edge.b, edge: edge.key });
    neighbors.get(edge.b)?.push({ to: edge.a, edge: edge.key });
  }

  const hasEdge = (idA, idB) => edgeLookup.has(edgeKey(idA, idB));
  const blockCells = [];

  for (let r = 0; r < gridRows - 1; r += 1) {
    for (let c = 0; c < gridCols - 1; c += 1) {
      const id00 = getNodeId(r, c);
      const id01 = getNodeId(r, c + 1);
      const id10 = getNodeId(r + 1, c);
      const id11 = getNodeId(r + 1, c + 1);
      if (!hasEdge(id00, id01) || !hasEdge(id10, id11) || !hasEdge(id00, id10) || !hasEdge(id01, id11)) {
        continue;
      }
      if (hasEdge(id00, id11) || hasEdge(id01, id10)) continue;
      const p00 = nodeLookup.get(id00);
      const p01 = nodeLookup.get(id01);
      const p11 = nodeLookup.get(id11);
      const p10 = nodeLookup.get(id10);
      if (!p00 || !p01 || !p11 || !p10) continue;
      const centerX = (p00.x + p01.x + p11.x + p10.x) * 0.25;
      const centerY = (p00.y + p01.y + p11.y + p10.y) * 0.25;
      const inset = 0.2 + seeded((r + 1) * 37 + (c + 1) * 11) * 0.08;
      const points = [p00, p01, p11, p10].map((p) => ({
        x: p.x + (centerX - p.x) * inset,
        y: p.y + (centerY - p.y) * inset,
      }));
      blockCells.push({ r, c, points, centerX, centerY });
    }
  }

  for (const block of blockCells) {
    const seed = seeded((block.r + 1) * 149 + (block.c + 1) * 67);
    const b = polygonBounds(block.points);
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    if (bw < 26 || bh < 24) continue;

    const nearWater = pointInAnyWater({ x: block.centerX, y: block.centerY }, 14);
    const touchWater = block.points.some((p) => pointInAnyWater(p, 4));
    if (touchWater) continue;

    const parkChance = nearWater ? 0.18 : 0.07;
    const parkSeed = seeded((block.r + 1) * 43 + (block.c + 1) * 61);
    if (seed > 1 - parkChance && parkSeed > 0.62) {
      const parkInset = 0.09 + seeded((block.r + 1) * 17 + block.c) * 0.05;
      const parkPoints = block.points.map((p) => pointToward(p, { x: block.centerX, y: block.centerY }, parkInset));
      parkPlots.push({ points: parkPoints });
      continue;
    }

    // Prefer large building masses over parks for denser urban texture.
    const largeMassChance = nearWater ? 0.6 : 0.38;
    if (seeded((block.r + 1) * 89 + (block.c + 1) * 97) < largeMassChance) {
      const massSetback = 5 + seeded((block.r + 1) * 113 + (block.c + 1) * 19) * 4;
      const mx = b.minX + massSetback;
      const my = b.minY + massSetback;
      const mw = bw - massSetback * 2;
      const mh = bh - massSetback * 2;
      if (mw > 14 && mh > 12) {
        const primary = createIrregularRect(
          mx,
          my,
          mw * (0.82 + seeded((block.r + 1) * 131 + (block.c + 1) * 17) * 0.12),
          mh * (0.8 + seeded((block.r + 1) * 37 + (block.c + 1) * 181) * 0.14),
          (block.r + 1) * 211 + (block.c + 1) * 223
        );
        if (!primary.some((p) => pointInAnyWater(p, 3.6))) {
          buildingPolys.push({
            points: primary,
            rot: (seeded((block.r + 1) * 173 + (block.c + 1) * 157) - 0.5) * 0.1,
            cx: mx + mw * 0.5,
            cy: my + mh * 0.5,
          });
        }
      }
      continue;
    }

    const setback = 4 + seeded((block.r + 1) * 23 + (block.c + 1) * 13) * 4.5;
    const inner = {
      minX: b.minX + setback,
      maxX: b.maxX - setback,
      minY: b.minY + setback,
      maxY: b.maxY - setback,
    };
    const innerW = inner.maxX - inner.minX;
    const innerH = inner.maxY - inner.minY;
    if (innerW < 20 || innerH < 18) continue;

    const cols = 2 + Math.floor(clamp(innerW / 32, 0, 3));
    const rows = 2 + Math.floor(clamp(innerH / 28, 0, 3));
    const gap = 1.6 + seeded((block.r + 1) * 31 + (block.c + 1) * 29) * 1.7;
    const cellW = (innerW - gap * (cols - 1)) / cols;
    const cellH = (innerH - gap * (rows - 1)) / rows;

    for (let rr = 0; rr < rows; rr += 1) {
      for (let cc = 0; cc < cols; cc += 1) {
        const lotSeed = seeded((block.r + 1) * (rr + 3) * 41 + (block.c + 1) * (cc + 5) * 23);
        if (lotSeed < 0.06) continue;
        const x = inner.minX + cc * (cellW + gap);
        const y = inner.minY + rr * (cellH + gap);
        const shrinkX = 0.06 + seeded((rr + 1) * (cc + 3) * 17) * 0.18;
        const shrinkY = 0.06 + seeded((rr + 2) * (cc + 4) * 19) * 0.18;
        const w = cellW * (1 - shrinkX);
        const h = cellH * (1 - shrinkY);
        const ox = (cellW - w) * 0.5 + (seeded((rr + 9) * (cc + 7) * 11) - 0.5) * 1.4;
        const oy = (cellH - h) * 0.5 + (seeded((rr + 5) * (cc + 6) * 13) - 0.5) * 1.4;
        if (w < 5.5 || h < 4.8) continue;
        const poly = createIrregularRect(
          x + ox,
          y + oy,
          w,
          h,
          (block.r + 1) * 101 + (block.c + 1) * 73 + rr * 17 + cc * 19
        );
        if (poly.some((p) => pointInAnyWater(p, 3.6))) continue;
        buildingPolys.push({
          points: poly,
          rot: (seeded((block.r + 1) * (block.c + 1) * (rr + 2) * (cc + 2) * 7) - 0.5) * 0.16,
          cx: x + ox + w * 0.5,
          cy: y + oy + h * 0.5,
        });
      }
    }
  }
};

buildNetwork();
return { nodes, edges, neighbors, nodeLookup, edgeLookup, parkPlots, buildingPolys, waterPolys, quadraticPoint, quadraticTangent, polygonBounds };
}
