import type { HealthResponse } from '@pixel/contracts';

type CreditsPanelProps = {
  title: string;
  body: string;
  meta: string;
  disclaimer: string;
  health: HealthResponse | null;
};

const providerLabel = (key: string) => (key === 'cobalt' ? 'COBALT' : 'THREADS');

export const CreditsPanel = ({ title, body, meta, disclaimer, health }: CreditsPanelProps) => (
  <aside className="credits-panel">
    <p className="eyebrow">{title}</p>
    <p className="credits-panel__body">{body}</p>
    <p className="credits-panel__meta">{meta}</p>

    <div className="credits-panel__providers">
      {health ? (
        Object.entries(health.providers).map(([key, provider]) => (
          <div className="credits-provider" key={key}>
            <span>{providerLabel(key)}</span>
            <span className={`status-pill status-pill--${provider.status === 'down' ? 'error' : provider.status === 'degraded' ? 'pending' : 'ready'}`}>
              {provider.status.toUpperCase()}
            </span>
          </div>
        ))
      ) : (
        <div className="credits-provider">
          <span>API</span>
          <span className="status-pill status-pill--pending">CHECKING</span>
        </div>
      )}
    </div>

    <p className="credits-panel__footnote">{disclaimer}</p>
  </aside>
);
