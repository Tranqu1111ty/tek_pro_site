type NumberedListProps = {
  items: readonly string[];
  compact?: boolean;
};

export function NumberedList({ items, compact = false }: NumberedListProps) {
  return (
    <ol className={compact ? "numbered-list is-compact" : "numbered-list"}>
      {items.map((item, index) => (
        <li key={item}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <p>{item}</p>
        </li>
      ))}
    </ol>
  );
}

type DetailRegisterProps = {
  title: string;
  code?: string;
  children: React.ReactNode;
  open?: boolean;
};

export function DetailRegister({ title, code, children, open }: DetailRegisterProps) {
  return (
    <details className="detail-register" open={open}>
      <summary>
        <span>{code}</span>
        <strong>{title}</strong>
        <i aria-hidden="true" />
      </summary>
      <div className="detail-body">{children}</div>
    </details>
  );
}

export function PlainList({ items }: { items: readonly string[] }) {
  return (
    <ul className="plain-register">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
