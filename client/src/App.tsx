import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import SitesOverview from "./pages/SitesOverview";
import NotFound from "./pages/NotFound";

// SiteDetail pulls in Recharts; keep it out of the sites-overview bundle.
const SiteDetail = lazy(() => import("./pages/SiteDetail"));

function App() {
  return (
    <div className="min-h-screen bg-ground text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<SitesOverview />} />
          <Route
            path="/sites/:id"
            element={
              <Suspense fallback={<p className="p-6 text-muted">Loading…</p>}>
                <SiteDetail />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
