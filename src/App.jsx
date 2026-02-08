import { HashRouter, NavLink, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import SubnettingLab from "./components/SubnettingLab.jsx";
import RoutingLab from "./components/RoutingLab.jsx";
import TcpLab from "./components/TcpLab.jsx";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="subnetting" element={<SubnettingLab />} />
          <Route path="routing" element={<RoutingLab />} />
          <Route path="tcp" element={<TcpLab />} />
          <Route
            path="*"
            element={
              <div className="p-6">
                <div className="card p-6">
                  <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
                  <p className="text-slate-600 mt-2">Try going back to the dashboard.</p>
                  <NavLink
                    to="/"
                    className="inline-block mt-4 rounded-lg border border-slate-200 px-4 py-2 bg-white hover:bg-slate-50"
                  >
                    Go to Dashboard
                  </NavLink>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
