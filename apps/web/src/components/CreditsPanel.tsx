import type { HealthResponse } from '@pixel/contracts';
import { getApiBaseUrl } from '../lib/api';

type CreditsPanelProps = {
  health: HealthResponse | null;
  locale: 'zh' | 'en';
};

type StatusTone = 'ok' | 'degraded' | 'checking';

type StatusCopy = {
  title: string;
  checking: string;
  ok: string;
  degraded: string;
  checkingDescription: string;
  okDescription: string;
  degradedDescription: string;
  apiBaseLabel: string;
  providersLabel: string;
};

const providerLabel = (key: string) => (key === 'cobalt' ? 'COBALT' : key.toUpperCase());

const statusCopy: Record<'zh' | 'en', StatusCopy> = {
  zh: {
    title: 'Backend Status',
    checking: '正在检查',
    ok: '服务正常',
    degraded: '部分异常',
    checkingDescription: '前端还在等待健康检查结果。',
    okDescription: '前端已经拿到后端健康检查结果，当前服务可用。',
    degradedDescription: '后端已响应，但至少有一个 provider 处于异常状态。',
    apiBaseLabel: 'API Base',
    providersLabel: 'Providers'
  },
  en: {
    title: 'Backend Status',
    checking: 'Checking handshake',
    ok: 'Handshake complete',
    degraded: 'Degraded',
    checkingDescription: 'Waiting for the backend health response.',
    okDescription: 'The frontend connected to the backend health endpoint successfully.',
    degradedDescription: 'The backend responded, but at least one provider is not fully healthy.',
    apiBaseLabel: 'API Base',
    providersLabel: 'Providers'
  }
};

const getStatusTone = (health: HealthResponse | null): StatusTone => {
  if (!health) {
    return 'checking';
  }

  return health.status === 'ok' ? 'ok' : 'degraded';
};

const getStatusLabel = (copy: StatusCopy, tone: StatusTone) => {
  switch (tone) {
    case 'ok':
      return copy.ok;
    case 'degraded':
      return copy.degraded;
    default:
      return copy.checking;
  }
};

const getStatusDescription = (copy: StatusCopy, tone: StatusTone) => {
  switch (tone) {
    case 'ok':
      return copy.okDescription;
    case 'degraded':
      return copy.degradedDescription;
    default:
      return copy.checkingDescription;
  }
};

const getProviderSummary = (health: HealthResponse | null) => {
  if (!health) {
    return 'CHECKING';
  }

  return Object.entries(health.providers)
    .map(([key, provider]) => `${providerLabel(key)}: ${provider.status.toUpperCase()}`)
    .join(' / ');
};

export const CreditsPanel = ({ health, locale }: CreditsPanelProps) => {
  const tone = getStatusTone(health);
  const copy = statusCopy[locale];

  return (
    <aside className="surface-card credits-panel credits-panel--status">
      <p className="credits-panel__eyebrow">{copy.title}</p>
      <div className="credits-panel__status-line">
        <span className={`credits-panel__status-text credits-panel__status-text--${tone}`}>
          {getStatusLabel(copy, tone)}
        </span>
        <span className="credits-panel__status-dot-wrap">
          <span className={`credits-panel__status-dot credits-panel__status-dot--${tone}`} aria-hidden="true" />
          <span className="credits-panel__tooltip" role="note">
            {getStatusDescription(copy, tone)}
          </span>
        </span>
      </div>

      <div className="credits-panel__details">
        <div className="credits-panel__detail-block">
          <p className="credits-panel__detail-label">{copy.apiBaseLabel}</p>
          <p className="credits-panel__detail-value">{getApiBaseUrl()}</p>
        </div>
        <div className="credits-panel__detail-block">
          <p className="credits-panel__detail-label">{copy.providersLabel}</p>
          <p className="credits-panel__detail-value">{getProviderSummary(health)}</p>
        </div>
      </div>
    </aside>
  );
};
