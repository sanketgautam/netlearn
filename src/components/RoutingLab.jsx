import { useEffect, useMemo, useRef, useState } from "react";

const NODES = [
  { id: "A", name: "Router A", x: 90, y: 150 },
  { id: "B", name: "Router B", x: 240, y: 70 },
  { id: "C", name: "Router C", x: 240, y: 230 },
  { id: "D", name: "Router D", x: 430, y: 150 },
  { id: "E", name: "Router E", x: 600, y: 150 },
];

// Undirected weighted links (think: link cost). You can interpret cost as delay, hop cost, etc.
const LINKS = [
  { a: "A", b: "B", cost: 2 },
  { a: "A", b: "C", cost: 2 },
  { a: "B", b: "D", cost: 3 },
  { a: "C", b: "D", cost: 1 },
  { a: "D", b: "E", cost: 2 },
  { a: "B", b: "C", cost: 2 },
];

function buildAdj() {
  const adj = new Map();
  for (const n of NODES) adj.set(n.id, []);
  for (const l of LINKS) {
    adj.get(l.a).push({ to: l.b, cost: l.cost });
    adj.get(l.b).push({ to: l.a, cost: l.cost });
  }
  return adj;
}

function dijkstra(adj, source) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  for (const k of adj.keys()) dist.set(k, Infinity);
  dist.set(source, 0);

  while (visited.size < adj.size) {
    let u = null;
    let best = Infinity;
    for (const [node, d] of dist.entries()) {
      if (!visited.has(node) && d < best) {
        best = d;
        u = node;
      }
    }

    // Remaining nodes are unreachable.
    if (u == null || !Number.isFinite(best)) break;

    visited.add(u);

    for (const e of adj.get(u) || []) {
      const alt = dist.get(u) + e.cost;
      if (alt < dist.get(e.to)) {
        dist.set(e.to, alt);
        prev.set(e.to, u);
      }
    }
  }

  return { dist, prev };
}

function reconstructPath(prev, src, dst) {
  const path = [];
  let cur = dst;
  while (cur != null) {
    path.push(cur);
    if (cur === src) break;
    cur = prev.get(cur);
  }
  path.reverse();
  if (path[0] !== src) return null;
  return path;
}

function nextHopForDestination(prev, src, dst) {
  const path = reconstructPath(prev, src, dst);
  if (!path || path.length < 2) return "—";
  return path[1];
}

function computeFitTransform(nodes, w, h) {
  // Keep a little padding so labels/edges don't touch the border.
  const pad = 44;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const availW = Math.max(1, w - pad * 2);
  const availH = Math.max(1, h - pad * 2);

  const scale = Math.min(availW / spanX, availH / spanY);

  // Center the topology in the available area.
  const offsetX = pad + (availW - spanX * scale) / 2 - minX * scale;
  const offsetY = pad + (availH - spanY * scale) / 2 - minY * scale;

  return { scale, offsetX, offsetY };
}

export default function RoutingLab() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const adj = useMemo(() => buildAdj(), []);

  const [source, setSource] = useState("A");
  const [dest, setDest] = useState("E");
  const [selectedRouter, setSelectedRouter] = useState("A");

  // IMPORTANT: shortest path depends on SOURCE, not the routing-table router.
  const { prev: prevFromSource } = useMemo(() => dijkstra(adj, source), [adj, source]);
  const { dist, prev } = useMemo(() => dijkstra(adj, selectedRouter), [adj, selectedRouter]);

  const shortestPath = useMemo(
    () => reconstructPath(prevFromSource, source, dest),
    [prevFromSource, source, dest]
  );

  const highlightedEdges = useMemo(() => {
    if (!shortestPath) return new Set();
    const s = new Set();
    for (let i = 0; i < shortestPath.length - 1; i += 1) {
      const u = shortestPath[i];
      const v = shortestPath[i + 1];
      s.add([u, v].sort().join("-"));
    }
    return s;
  }, [shortestPath]);

  // Redraw on resize (fixes clipping/cut-off topology on narrow widths).
  const [resizeTick, setResizeTick] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => setResizeTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // light background
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    const nodeById = new Map(NODES.map((n) => [n.id, n]));
    const { scale, offsetX, offsetY } = computeFitTransform(NODES, cssW, cssH);

    const tx = (x) => x * scale + offsetX;
    const ty = (y) => y * scale + offsetY;

    // edges
    for (const l of LINKS) {
      const a = nodeById.get(l.a);
      const b = nodeById.get(l.b);
      const key = [l.a, l.b].sort().join("-");
      const isHot = highlightedEdges.has(key);

      ctx.strokeStyle = isHot ? "#2563eb" : "#94a3b8";
      ctx.lineWidth = isHot ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(tx(a.x), ty(a.y));
      ctx.lineTo(tx(b.x), ty(b.y));
      ctx.stroke();

      // cost label
      const mx = (tx(a.x) + tx(b.x)) / 2;
      const my = (ty(a.y) + ty(b.y)) / 2;
      ctx.fillStyle = "rgba(15,23,42,0.8)";
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText(String(l.cost), mx + 6, my - 6);
    }

    // nodes
    for (const n of NODES) {
      const isSrc = n.id === source;
      const isDst = n.id === dest;
      const isSelected = n.id === selectedRouter;

      let fill = "#6366f1";
      if (isSelected) fill = "#8b5cf6";
      if (isSrc) fill = "#10b981";
      if (isDst) fill = "#f59e0b";

      const cx = tx(n.x);
      const cy = ty(n.y);

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(15,23,42,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText(n.id, cx - 4, cy + 4);

      ctx.fillStyle = "rgba(15,23,42,0.7)";
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText(n.name, cx - 30, cy + 42);
    }

    // Legend
    ctx.fillStyle = "rgba(15,23,42,0.7)";
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillText(
      "Green=source, Amber=destination, Purple=router showing routing table",
      16,
      22
    );
  }, [source, dest, selectedRouter, highlightedEdges, resizeTick]);

  const totalCost = shortestPath
    ? shortestPath.slice(0, -1).reduce((sum, u, i) => {
        const v = shortestPath[i + 1];
        const link = LINKS.find((l) => (l.a === u && l.b === v) || (l.a === v && l.b === u));
        return sum + (link ? link.cost : 0);
      }, 0)
    : null;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Routing Lab</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Routers forward packets using a{" "}
          <span className="text-slate-900 font-medium">routing table</span>. One common goal is to
          find the{" "}
          <span className="text-slate-900 font-medium">lowest-cost path</span> through a network
          topology.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Interactive topology</h2>
          <p className="text-sm text-slate-600">
            Choose a source and destination, then the canvas highlights the shortest path.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <label className="text-slate-700">
              Source
              <select
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-2 py-2"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {NODES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-slate-700">
              Destination
              <select
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-2 py-2"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
              >
                {NODES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-slate-700">
              Show table for
              <select
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-2 py-2"
                value={selectedRouter}
                onChange={(e) => setSelectedRouter(e.target.value)}
              >
                {NODES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div ref={containerRef} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <canvas ref={canvasRef} className="w-full h-[340px]" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Shortest path result</p>
            <p className="mt-1">
              {shortestPath ? (
                <>
                  Path: <span className="font-mono">{shortestPath.join(" → ")}</span>
                  {typeof totalCost === "number" ? (
                    <>
                      {" "}• Total cost: <span className="font-mono">{totalCost}</span>
                    </>
                  ) : null}
                </>
              ) : (
                "No path found (check the topology)."
              )}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              We’re using Dijkstra’s algorithm (classic shortest path). In real networks,
              protocols like OSPF/IS-IS run similar math with link-state information.
            </p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Routing table (concept)</h2>
          <p className="text-sm text-slate-600">
            A routing table says: “To reach destination X, send to next hop Y.” Below, we compute the
            next hop from <span className="text-slate-900 font-medium">{selectedRouter}</span> to every
            other router.
          </p>

          <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">Destination</th>
                  <th className="text-left px-4 py-3">Next hop</th>
                  <th className="text-left px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {NODES.filter((n) => n.id !== selectedRouter).map((n) => (
                  <tr key={n.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-mono text-slate-900">{n.id}</td>
                    <td className="px-4 py-3 font-mono text-slate-900">
                      {nextHopForDestination(prev, selectedRouter, n.id)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-900">
                      {Number.isFinite(dist.get(n.id)) ? dist.get(n.id) : "∞"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
            <p className="font-medium text-slate-900">Beginner intuition</p>
            <p>
              Think of each router as a person with a map. If you know the best next step for every
              destination, you don’t need the whole path — you just forward the packet one hop closer.
            </p>
            <p className="text-xs text-slate-500">
              Real routing tables use prefixes (subnets), not just single routers — which is why
              subnetting matters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
