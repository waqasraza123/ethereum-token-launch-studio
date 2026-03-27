import Link from "next/link";
import { routePaths } from "@/lib/routing/route-paths";

const navigationItems = [
  { href: routePaths.home, label: "Home" },
  { href: routePaths.signIn, label: "Sign in" },
  { href: routePaths.dashboard, label: "Dashboard" },
] as const;

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link className="app-brand" href={routePaths.home}>
          <span className="app-brand-mark" aria-hidden="true" />
          <span>Ethereum Token Launch Studio</span>
        </Link>
        <nav className="app-nav" aria-label="Primary">
          {navigationItems.map((item) => (
            <Link className="app-nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
