import { AlertCircle, Download, Layers3 } from 'lucide-react';
import type { QueueItem } from '../lib/types';
import { buildFileDownloadUrl } from '../lib/api';
import { platformLabel, summarizeUrl } from '../lib/utils';

type QueueListProps = {
  items: QueueItem[];
  clearLabel: string;
  emptyTitle: string;
  emptyHint: string;
  selectedAssetsLabel: string;
  stateLabels: Record<'pending' | 'resolving' | 'ready' | 'error', string>;
  onClear: () => void;
  onToggleAsset: (itemId: string, token: string) => void;
};

const kindLabel = (kind: 'video' | 'image' | 'audio', index: number) => `${kind.toUpperCase()} ${String(index + 1).padStart(2, '0')}`;

const inferPlatformFromUrl = (url: string) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('instagram')) {
      return 'instagram' as const;
    }
    if (hostname.includes('threads')) {
      return 'threads' as const;
    }
    if (hostname.includes('tiktok')) {
      return 'tiktok' as const;
    }
  } catch {
    return 'auto' as const;
  }

  return 'auto' as const;
};

const detectContentType = (item: QueueItem) => {
  const kinds = [...new Set((item.response?.assets ?? []).map((asset) => asset.kind))];

  if (kinds.length === 0) {
    return null;
  }
  if (kinds.length > 1) {
    return 'MIXED';
  }
  if (kinds[0] === 'image') {
    return 'IMAGE';
  }
  if (kinds[0] === 'video') {
    return 'VIDEO';
  }
  return 'AUDIO';
};

const getAssetCountLabel = (item: QueueItem) => {
  const count = item.response?.assets.length ?? 0;

  if (count <= 0) {
    return null;
  }

  return `${count} FILE${count > 1 ? 'S' : ''}`;
};

const getResolutionLabel = (item: QueueItem) => {
  const candidate = (item.response?.assets ?? [])
    .filter((asset) => asset.width && asset.height)
    .sort((left, right) => (right.width ?? 0) * (right.height ?? 0) - (left.width ?? 0) * (left.height ?? 0))[0];

  if (!candidate?.width || !candidate.height) {
    return null;
  }

  return `${candidate.width}x${candidate.height}`;
};

export const QueueList = ({
  items,
  clearLabel,
  emptyTitle,
  emptyHint,
  selectedAssetsLabel,
  stateLabels,
  onClear,
  onToggleAsset
}: QueueListProps) => (
  <section className="surface-card queue-shell">
    <div className="queue-header">
      <div className="queue-header__copy">
        <div className="queue-header__title-row">
          <Layers3 className="button-icon" strokeWidth={1.8} />
          <h2 className="queue-title">Queue</h2>
        </div>
      </div>
      <div className="queue-header__actions">
        <span className="queue-count-chip">{items.length} ITEMS</span>
        <button type="button" className="queue-clear-button" onClick={onClear} disabled={items.length === 0}>
          {clearLabel}
        </button>
      </div>
    </div>

    {items.length === 0 ? (
      <div className="queue-empty-state">
        <div className="queue-empty-badge">
          <div className="queue-empty-icon">
            <Layers3 className="button-icon" strokeWidth={1.8} />
          </div>
        </div>
        <p className="queue-empty__title">{emptyTitle}</p>
        <p className="queue-empty__hint">{emptyHint}</p>
      </div>
    ) : (
      <div className="queue-rows">
        {items.map((item, index) => {
          const response = item.response;
          const assets = response?.assets ?? [];
          const itemPlatform = response?.platform ?? inferPlatformFromUrl(item.url);
          const contentType = detectContentType(item);
          const assetCount = getAssetCountLabel(item);
          const resolution = getResolutionLabel(item);
          const warningText = response?.warnings.join('\n');

          return (
            <article className={`queue-row status-${item.status}`} key={item.id}>
              <div className="queue-row__top">
                <div className="queue-row__main">
                  <div className="queue-order">{String(index + 1).padStart(2, '0')}</div>
                  <div className="queue-copy queue-copy--full">
                    <div className="queue-tag-row">
                      <span className="queue-meta-tag">{platformLabel(itemPlatform).toUpperCase()}</span>
                      {contentType ? <span className="queue-meta-tag">{contentType}</span> : null}
                      {assetCount ? <span className="queue-meta-tag">{assetCount}</span> : null}
                      {resolution ? <span className="queue-meta-tag">{resolution}</span> : null}
                      <span className="queue-meta-tag queue-meta-tag--link" data-tooltip={summarizeUrl(item.url)} title={item.url}>
                        LINK
                      </span>
                    </div>
                  </div>
                </div>

                <div className="queue-actions">
                  <div className="queue-status-cluster">
                    <span
                      className={`queue-status-pill queue-status-pill--${item.status} ${item.status === 'error' && item.error ? 'queue-status-pill--tooltip' : ''}`}
                      data-tooltip={item.status === 'error' ? item.error : undefined}
                      title={item.status === 'error' ? item.error : undefined}
                    >
                      {item.status === 'error' ? (
                        <>
                          <AlertCircle className="queue-status-pill__icon" strokeWidth={1.8} />
                          {stateLabels[item.status]}
                        </>
                      ) : (
                        stateLabels[item.status]
                      )}
                    </span>
                    {warningText ? (
                      <span className="queue-status-hint" data-tooltip={warningText} title={warningText} aria-label={warningText}>
                        <AlertCircle className="queue-status-hint__icon" strokeWidth={1.8} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {response ? (
                <div className="queue-row__detail">
                  <div className="queue-row__detail-head">
                    <span className="meta-badge">{selectedAssetsLabel}</span>
                    <strong>{item.selectedTokens.length}</strong>
                  </div>
                  <div className="asset-grid">
                    {assets.map((asset, assetIndex) => {
                      const selected = item.selectedTokens.includes(asset.downloadToken);
                      return (
                        <div className={`asset-chip ${selected ? 'is-selected' : ''}`} key={asset.downloadToken}>
                          {asset.previewUrl ? (
                            <span className="asset-chip__thumb">
                              <img src={asset.previewUrl} alt={kindLabel(asset.kind, assetIndex)} loading="lazy" />
                            </span>
                          ) : null}
                          <button type="button" className="asset-chip__toggle" onClick={() => onToggleAsset(item.id, asset.downloadToken)}>
                            {kindLabel(asset.kind, assetIndex)}
                          </button>
                          {asset.width && asset.height ? <span className="asset-chip__meta">{asset.width}x{asset.height}</span> : null}
                          <a className="asset-chip__download" href={buildFileDownloadUrl(asset.downloadToken)}>
                            <Download className="button-icon" strokeWidth={1.8} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    )}
  </section>
);
