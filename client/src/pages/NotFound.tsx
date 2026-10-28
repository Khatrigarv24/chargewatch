import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <p className="font-mono text-sm text-status-faulted">404</p>
      <h1 className="mb-4 text-2xl font-semibold text-ink">
        Not on this network
      </h1>
      <p className="mb-4 text-muted">
        There's no site or charger at this address.
      </p>
      <Link to="/" className="draw inline-block py-1.5 text-ink">
        Back to sites
      </Link>
    </div>
  );
}
