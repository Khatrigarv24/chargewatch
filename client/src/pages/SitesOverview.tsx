import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSites, type SiteSummary } from "../api";

export default function SitesOverview() {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSites()
      .then(setSites)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p data-testid="error">Failed to load sites: {error}</p>;
  if (!sites) return <p data-testid="loading">Loading sites…</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sites</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <Link
            key={site.id}
            to={`/sites/${site.id}`}
            data-testid="site-card"
            className="block rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-medium text-lg">{site.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{site.city}</p>
            <div className="flex gap-3 text-sm">
              <span data-testid="count-available" className="text-green-600">
                {site.available} available
              </span>
              <span data-testid="count-charging" className="text-blue-600">
                {site.charging} charging
              </span>
              <span data-testid="count-faulted" className="text-red-600">
                {site.faulted} faulted
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
