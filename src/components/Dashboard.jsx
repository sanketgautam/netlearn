import { NavLink } from "react-router-dom";

const CardLink = ({ to, title, body, bullets }) => (
  <NavLink to={to} className="block card p-6 hover:bg-slate-50 transition">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 mt-1">{body}</p>
      </div>
      <span className="text-slate-400">→</span>
    </div>
    <ul className="mt-4 text-sm text-slate-600 list-disc list-inside space-y-1">
      {bullets.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  </NavLink>
);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2 max-w-3xl">
          A computer network is mostly three things:
          <span className="text-slate-900 font-medium"> addressing</span> (where
          are you?), <span className="text-slate-900 font-medium">routing</span> (how do
          we get there?), and <span className="text-slate-900 font-medium">transport</span> (how do
          we send data reliably and quickly?).
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <CardLink
          to="/subnetting"
          title="1) Subnetting Lab"
          body="Turn an IP + mask into a real range of addresses."
          bullets={[
            "Visualize network vs host bits",
            "Compute network/broadcast/usable hosts",
            "Practice quiz (prefix → hosts, membership)",
          ]}
        />
        <CardLink
          to="/routing"
          title="2) Routing Lab"
          body="See how routers pick paths through a topology."
          bullets={[
            "Interactive canvas topology",
            "Routing table for a chosen router",
            "Shortest path (Dijkstra) + highlighted route",
          ]}
        />
        <CardLink
          to="/tcp"
          title="3) TCP Lab"
          body="Learn TCP setup + congestion control with animations."
          bullets={[
            "3-way handshake (canvas animation)",
            "Congestion window graph (slow start → AIMD)",
            "Mini state machine diagram",
          ]}
        />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          How this matches fundamentals
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          These labs line up with the core topics in most undergraduate network
          courses: IP addressing/subnetting, routing/forwarding, and TCP
          reliability + congestion control.
        </p>
      </div>
    </div>
  );
}
