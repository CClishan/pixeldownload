import { ChevronDown, Download, Layers3 } from 'lucide-react';
import type { QueueItem } from '../lib/types';
import { buildFileDownloadUrl } from '../lib/api';
import { platformLabel } from '../lib/utils';

type QueueListProps = {
  items: QueueItem[];
  clearLabel: string;
  emptyTitle: string;
  emptyHint: string;
  detailLabel: string;
  hideLabel: string;
  downloadLabel: string;
  selectedAssetsLabel: string;
  stateLabels: Record<'pending' | 'resolving' | 'ready' | 'error', string>;
  onClear: () => void;
  onToggleExpand: (id: string) => void;
  onToggleAsset: (itemId: string, token: string) => void;
};

const kindLabel = (kind: 'video' | 'image' | 'audio', index: number) => `${kind.toUpperCase()} ${String(index + 1).padStart(2, '0')}`;

const detectContentType = (item: QueueItem) => {
  const kinds = [...new Set((item.response?.assets ?? []).map((asset) => asset.kind))];

  if (kinds.length === 0) {
    return 'LINK';
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

export const QueueList = ({
  items,
  clearLabel,
  emptyTitle,
  emptyHint,
  detailLabel,
  hideLabel,
  downloadLabel,
  selectedAssetsLabel,
  stateLabels,
  onClear,
  onToggleExpand,
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
          const itemPlatform = response?.platform ?? 'auto';
          const singleAsset = assets.length === 1 ? assets[0] : undefined;
          const titleText = `${String(index + 1).padStart(2, '0')} / ${platformLabel(itemPlatform).toUpperCase()} / ${detectContentType(item)}`;

          return (
            <article className={`queue-row status-${item.status}`} key={item.id}>
              <div className="queue-row__top">
                <div className="queue-row__main">
                  <div className="queue-copy queue-copy--full">
                    <p className="queue-file-name">{titleText}</p>
                    <p className="queue-link">{item.url}</p>
                    {item.error ? <p className="queue-note queue-note--error">{item.error}</p> : null}
                  </div>
                </div>

                <div className="queue-actions">
                  <div className="queue-status-cluster">
                    <span className={`queue-status-pill queue-status-pill--${item.status}`}>{stateLabels[item.status]}</span>
                  </div>

                  <div className="queue-action-buttons">
                    {singleAsset ? (
                      <a
                        className="queue-action-button queue-action-button--icon queue-action-button--download"
                        href={buildFileDownloadUrl(singleAsset.downloadToken)}
                        aria-label={downloadLabel}
                      >
                        <Download className="button-icon" strokeWidth={1.8} />
                      </a>
                    ) : null}
                    {response ? (
                      <button
                        type="button"
                        className="queue-action-button queue-action-button--icon"
                        onClick={() => onToggleExpand(item.id)}
                        aria-label={item.expanded ? hideLabel : detailLabel}
                      >
                        <ChevronDown className={`button-icon ${item.expanded ? 'is-open' : ''}`} strokeWidth={1.8} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {response && item.expanded ? (
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
                          <button type="button" className="asset-chip__toggle" onClick={() => onToggleAsset(item.id, asset.downloadToken)}>
                            {kindLabel(asset.kind, assetIndex)}
                          </button>
                          <a className="asset-chip__download" href={buildFileDownloadUrl(asset.downloadToken)}>
                            {downloadLabel}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                  {response.warnings.length > 0 ? (
                    <div className="queue-row__warnings">
                      {response.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    )}
  </section>
);
