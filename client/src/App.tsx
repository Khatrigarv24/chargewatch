import { Route, Routes } from "react-router-dom";
import SitesOverview from "./pages/SitesOverview";
import SiteDetail from "./pages/SiteDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SitesOverview />} />
      <Route path="/sites/:id" element={<SiteDetail />} />
    </Routes>
  );
}

export default App;
