import { useEffect, useMemo, useRef, useState } from "react";

function drawHandshake(ctx, w, h, phase) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const left = 110;
  const right = w - 110;
  const mid = h / 2;

  // lifelines
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, mid - 70);
  ctx.lineTo(left, mid + 70);
  ctx.moveTo(right, mid - 70);
  ctx.lineTo(right, mid + 70);
  ctx.stroke();

  const arrow = (y, color, label, dir = "lr") => {
    const x1 = dir === "lr" ? left : right;
    const x2 = dir === "lr" ? right : left;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    ctx.beginPath();
    if (dir === "lr") {
      ctx.moveTo(x2 - 10, y - 6);
      ctx.lineTo(x2, y);
      ctx.lineTo(x2 - 10, y + 6);
    } else {
      ctx.moveTo(x2 + 10, y - 6);
      ctx.lineTo(x2, y);
      ctx.lineTo(x2 + 10, y + 6);
    }
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "14px ui-sans-serif, system-ui";
    ctx.fillText(label, w / 2 - ctx.measureText(label).width / 2, y - 10);
  };

  // Messages
  if (phase >= 1) arrow(mid - 35, "#2563eb", "SYN (seq = x)", "lr");
  if (phase >= 2) arrow(mid, "#7c3aed", "SYN-ACK (seq = y, ack = x+1)", "rl");
  if (phase >= 3) arrow(mid + 35, "#10b981", "ACK (ack = y+1)", "lr");

  ctx.fillStyle = "#0f172a";
  ctx.font = "16px ui-sans-serif, system-ui";
  ctx.fillText("Client", left - 26, mid + 92);
  ctx.fillText("Server", right - 28, mid + 92);
}

function generateCwndSeries({ rounds, ssthresh, lossRound }) {
  const series = [];
  let cwnd = 1;
  for (let r = 1; r <= rounds; r += 1) {
    // loss event happens at the END of that round
    series.push({ r, cwnd });

    if (r === lossRound) {
      // classic Reno-ish behavior: halve cwnd and set ssthresh
      cwnd = Math.max(1, Math.floor(cwnd / 2));
      continue;
    }

    if (cwnd < ssthresh) cwnd = cwnd * 2;
    else cwnd = cwnd + 1;
  }
  return series;
}

function drawCwnd(ctx, w, h, series, ssthresh, lossRound) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const pad = { l: 46, r: 16, t: 22, b: 34 };

  const maxCwnd = Math.max(2, ...series.map((p) => p.cwnd));
  const maxR = Math.max(1, ...series.map((p) => p.r));

  const x = (r) => pad.l + ((r - 1) / (maxR - 1 || 1)) * (w - pad.l - pad.r);
  const y = (c) => h - pad.b - (c / maxCwnd) * (h - pad.t - pad.b);

  // axes
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();

  // ssthresh line
  ctx.strokeStyle = "rgba(245,158,11,0.65)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(pad.l, y(ssthresh));
  ctx.lineTo(w - pad.r, y(ssthresh));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(245,158,11,0.95)";
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillText(`ssthresh = ${ssthresh}`, pad.l + 8, y(ssthresh) - 8);

  // line
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 3;
  ctx.beginPath();
  series.forEach((p, i) => {
    const px = x(p.r);
    const py = y(p.cwnd);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // points
  for (const p of series) {
    const px = x(p.r);
    const py = y(p.cwnd);
    const isLoss = p.r === lossRound;
    ctx.fillStyle = isLoss ? "#ef4444" : "#a5b4fc";
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // labels
  ctx.fillStyle = "#0f172a";
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillText("RTT rounds →", w - 96, h - 12);
  ctx.save();
  ctx.translate(14, h / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("cwnd (segments)", 0, 0);
  ctx.restore();

  if (lossRound) {
    ctx.fillStyle = "rgba(239,68,68,0.9)";
    ctx.fillText(`loss at round ${lossRound}`, pad.l + 8, pad.t + 14);
  }
}

const TCP_STATES = [
  { id: "CLOSED", x: 90, y: 110 },
  { id: "SYN-SENT", x: 270, y: 60 },
  { id: "ESTABLISHED", x: 470, y: 110 },
  { id: "FIN-WAIT", x: 270, y: 160 },
];

export default function TcpLab() {
  const handshakeRef = useRef(null);
  const cwndRef = useRef(null);

  const [phase, setPhase] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const [ssthresh, setSsthresh] = useState(8);
  const [lossRound, setLossRound] = useState(8);

  const [activeState, setActiveState] = useState("CLOSED");

  const series = useMemo(
    () => generateCwndSeries({ rounds: 14, ssthresh, lossRound }),
    [ssthresh, lossRound]
  );

  useEffect(() => {
    const canvas = handshakeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawHandshake(ctx, cssW, cssH, phase);
  }, [phase]);

  useEffect(() => {
    const canvas = cwndRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawCwnd(ctx, cssW, cssH, series, ssthresh, lossRound);
  }, [series, ssthresh, lossRound]);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setPhase((p) => (p + 1) % 4), 1600);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">TCP Lab</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          TCP is the Internet’s “reliable delivery” protocol. It does three big jobs: (1) set up a
          connection, (2) deliver bytes reliably and in order, and (3) avoid congestion by adjusting
          its sending rate.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">1) 3-way handshake</h2>
          <p className="text-sm text-slate-600">
            The handshake creates shared state (sequence numbers) so both sides know what “the next
            byte” means.
          </p>

          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <canvas ref={handshakeRef} className="w-full h-[240px]" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPhase(0)}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm"
            >
              Reset
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  phase === p
                    ? "border-brand-300 bg-brand-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                Step {p}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
              Auto-play
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
            <p className="font-medium text-slate-900">What to notice</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each side chooses an initial sequence number (x and y).</li>
              <li>ACK means “I have received everything up to byte N-1.”</li>
              <li>The connection is established only after both sides see an ACK.</li>
            </ul>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">2) Congestion window (cwnd)</h2>
          <p className="text-sm text-slate-600">
            TCP doesn’t want to overwhelm the network. It uses cwnd to limit how many segments can be
            “in flight” (sent but not yet ACKed).
          </p>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <label className="text-slate-700">
              ssthresh (slow-start threshold)
              <input
                type="range"
                min="2"
                max="16"
                value={ssthresh}
                onChange={(e) => setSsthresh(Number(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">Current: {ssthresh}</div>
            </label>
            <label className="text-slate-700">
              Loss round
              <input
                type="range"
                min="2"
                max="14"
                value={lossRound}
                onChange={(e) => setLossRound(Number(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">Current: {lossRound}</div>
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <canvas ref={cwndRef} className="w-full h-[260px]" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Beginner summary</p>
            <p className="mt-1">
              <span className="text-slate-900 font-medium">Slow start</span>: cwnd grows quickly
              (doubling) while the network seems empty.
              <br />
              <span className="text-slate-900 font-medium">Congestion avoidance</span>: cwnd grows
              slowly (about +1 per RTT).
              <br />
              <span className="text-slate-900 font-medium">Loss</span>: TCP interprets loss as
              congestion and reduces cwnd.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">3) Mini TCP state machine</h2>
        <p className="text-sm text-slate-600">
          Real TCP has many states. Here’s a simplified view you can click through.
        </p>

        <div className="grid md:grid-cols-4 gap-3">
          {TCP_STATES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveState(s.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                activeState === s.id
                  ? "border-brand-300 bg-brand-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="font-medium text-slate-900">{s.id}</div>
              <div className="text-xs text-slate-500 mt-1">
                {s.id === "CLOSED" && "No connection state."}
                {s.id === "SYN-SENT" && "Client sent SYN, waiting for SYN-ACK."}
                {s.id === "ESTABLISHED" && "Data can flow both directions."}
                {s.id === "FIN-WAIT" && "Closing: waiting for teardown to finish."}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Try to connect the dots</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              CLOSED → SYN-SENT happens when the client calls <span className="font-mono">connect()</span>.
            </li>
            <li>SYN-SENT → ESTABLISHED happens after the ACK of the SYN-ACK.</li>
            <li>ESTABLISHED → FIN-WAIT happens during close (FIN exchange).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
