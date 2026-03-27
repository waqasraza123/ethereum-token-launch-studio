import type { ReactNode } from "react";

type PageShellProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}>;

export function PageShell({ actions, children, description, eyebrow, title }: PageShellProps) {
  return (
    <section className="page-shell">
      <div className="page-shell-header">
        <div className="page-shell-copy">
          <p className="page-shell-eyebrow">{eyebrow}</p>
          <h1 className="page-shell-title">{title}</h1>
          <p className="page-shell-description">{description}</p>
        </div>
        {actions}
      </div>
      <div className="page-shell-grid">{children}</div>
    </section>
  );
}
