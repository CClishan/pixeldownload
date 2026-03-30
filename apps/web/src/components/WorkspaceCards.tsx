type Card = {
  label: string;
  body: string;
  meta: string;
};

type WorkspaceCardsProps = {
  cards: Card[];
};

export const WorkspaceCards = ({ cards }: WorkspaceCardsProps) => (
  <section className="workspace-cards">
    {cards.map((card) => (
      <article className="workspace-card" key={card.label}>
        <p className="workspace-card__label">{card.label}</p>
        <h3 className="workspace-card__body">{card.body}</h3>
        <p className="workspace-card__meta">{card.meta}</p>
      </article>
    ))}
  </section>
);
