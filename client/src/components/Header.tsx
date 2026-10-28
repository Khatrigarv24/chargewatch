import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
        <Link
          to="/"
          className="draw flex items-center gap-2 py-1.5 font-mono text-sm font-medium tracking-wide text-ink"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="text-accent"
          >
            <path
              d="M17.5 4 9 18h5.5l-1 10L23 14h-5.5l1-10Z"
              fill="currentColor"
            />
          </svg>
          CHARGEWATCH
        </Link>
      </div>
    </header>
  );
}
