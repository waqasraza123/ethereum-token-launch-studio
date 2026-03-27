type PlaceholderPanelProps = Readonly<{
  title: string;
  description: string;
  items: readonly string[];
}>;

export function PlaceholderPanel({ description, items, title }: PlaceholderPanelProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">{title}</h2>
      <p className="placeholder-panel-description">{description}</p>
      <ul className="placeholder-list">
        {items.map((item) => (
          <li className="placeholder-list-item" key={item}>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
