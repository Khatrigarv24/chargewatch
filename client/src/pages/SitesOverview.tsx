import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getSites, type SiteSummary } from "../api";
import { countUp, reveal } from "../motion";

// Warm the SiteDetail chunk (Recharts and friends) before the click, so the
// common path -- hover/focus a card from the overview, then open it --
// doesn't pay for the lazy-loaded chunk after navigating.
let siteDetailPrefetched = false;
function prefetchSiteDetail() {
  if (siteDetailPrefetched) return;
  siteDetailPrefetched = true;
  void import("./SiteDetail");
}

const COUNT_FIELDS: { key: keyof SiteSummary; label: string; testId: string; colorClass: string }[] = [
  { key: "available", label: "available", testId: "count-available", colorClass: "text-status-available" },
  { key: "charging", label: "charging", testId: "count-charging", colorClass: "text-status-charging" },
  { key: "faulted", label: "faulted", testId: "count-faulted", colorClass: "text-status-faulted" },
  { key: "offline", label: "offline", testId: "count-offline", colorClass: "text-status-offline" },
];

export default function SitesOverview() {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSites()
      .then(setSites)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!sites || !gridRef.current) return;
    reveal(gridRef.current.querySelectorAll("[data-testid=site-card]"));
    gridRef.current
      .querySelectorAll("[data-count]")
      .forEach((el) => countUp(el, Number(el.getAttribute("data-count"))));
  }, [sites]);

  if (error) return <p data-testid="error" className="p-6 text-status-faulted">Failed to load sites: {error}</p>;
  if (!sites) return <p data-testid="loading" className="p-6 text-muted">Loading sites…</p>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-ink">Sites</h1>
      <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Link
            key={site.id}
            to={`/sites/${site.id}`}
            data-testid="site-card"
            className="lift-on-hover block rounded border border-line bg-surface p-4"
            onMouseEnter={prefetchSiteDetail}
            onFocus={prefetchSiteDetail}
          >
            <h2 className="text-lg font-medium text-ink">{site.name}</h2>
            <p className="mb-3 text-sm text-muted">
              {site.city} · <span className="font-mono">{site.capacity_kw}</span> kW capacity
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              {COUNT_FIELDS.map((field) => {
                const live = field.key === "charging" && Number(site[field.key]) > 0;
                return (
                  <span
                    key={field.key}
                    data-testid={field.testId}
                    className={
                      live
                        ? "charge-flow rounded-full px-2 py-0.5 text-ground"
                        : field.colorClass
                    }
                  >
                    <span className="font-mono" data-count={site[field.key]}>
                      0
                    </span>{" "}
                    {field.label}
                  </span>
                );
              })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
