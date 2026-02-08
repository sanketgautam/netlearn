import { NavLink, Outlet } from "react-router-dom";

const NavItem = ({ to, title, subtitle }) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) =>
      [
        "block rounded-xl border px-4 py-3 transition",
        isActive
          ? "border-brand-400/60 bg-brand-50"
          : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")
    }
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <span className="text-slate-400">→</span>
    </div>
  </NavLink>
);

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <header className="flex flex-col gap-2">
          <p className="text-brand-700 font-semibold tracking-wide">
            NetLearn Labs • Networking Fundamentals
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Learn Subnetting, Routing, and TCP — by doing
          </h1>
          <p className="text-slate-600 max-w-3xl">
            These labs are beginner-friendly. Every page explains the concept,
            then lets you play with a visual interactive.
          </p>
        </header>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 mt-8">
          <aside className="space-y-4">
            <div className="card p-4">
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Navigation
              </p>
              <div className="mt-3 grid gap-2">
                <NavItem
                  to="/"
                  title="Dashboard"
                  subtitle="Quick overview + jump into a lab"
                />
                <NavItem
                  to="/subnetting"
                  title="Subnetting Lab"
                  subtitle="Network/host bits, ranges, and a quiz"
                />
                <NavItem
                  to="/routing"
                  title="Routing Lab"
                  subtitle="Topology, routing table, shortest path"
                />
                <NavItem
                  to="/tcp"
                  title="TCP Lab"
                  subtitle="Handshake animation + congestion window"
                />
              </div>
            </div>

            <div className="card p-4 text-sm text-slate-600 space-y-2">
              <p className="font-medium text-slate-900">Tip</p>
              <p>
                If you’re confused, start with Subnetting. Routing and TCP make
                more sense once you know how IP addresses are grouped.
              </p>
              <p className="text-xs text-slate-500">
                Deployed on GitHub Pages later — using HashRouter to keep routes
                working.
              </p>
            </div>
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          Built with React + Vite + Tailwind + React Router.
        </footer>
      </div>
    </div>
  );
}
