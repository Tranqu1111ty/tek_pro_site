import type { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  index: string;
  label: string;
  title: string;
  tone?: "navy" | "white" | "black";
  children: ReactNode;
  className?: string;
};

export function SectionShell({
  id,
  index,
  label,
  title,
  tone = "navy",
  children,
  className = "",
}: SectionShellProps) {
  return (
    <section id={id} className={`section-shell tone-${tone} ${className}`}>
      <div className="section-grid blueprint-grid">
        <div className="section-rail" aria-hidden="true">
          <span>{index}</span>
          <i />
        </div>
        <header className="section-heading">
          <p className="utility-label">{label}</p>
          <h2>{title}</h2>
        </header>
        <div className="section-content">{children}</div>
      </div>
    </section>
  );
}
