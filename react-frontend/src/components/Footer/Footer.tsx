import { Link } from "@tanstack/react-router";
import { ClaimoMark } from "@/components/common/claimo-mark";
import { FOOTER_COLUMNS, LEGAL_LINKS } from "./footer-constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-elevated/30">
      <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <ClaimoMark className="h-6 w-6" />
            <span className="font-semibold">Claimo</span>
          </div>
          <div className="mt-3 text-muted-foreground">
            Construction payment claims, in one place.
          </div>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {col.heading}
            </div>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Claimo Technologies B.V.</div>
          <div className="flex gap-5">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
