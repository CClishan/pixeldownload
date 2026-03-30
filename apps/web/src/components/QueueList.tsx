import type { QueueItem } from '../lib/types';
import { buildFileDownloadUrl } from '../lib/api';
import { platformLabel, summarizeUrl } from '../lib/utils';
import { ChevronIcon, DownloadIcon, QueueIcon, TrashIcon } from './icons';

type QueueListProps = {
  items: QueueItem[];
  title: string;
  clearLabel: string;
  emptyTitle: string;
  emptyHint: string;
  detailLabel: string;
  hideLabel: string;
  removeLabel: string;
  downloadLabel: string;
  selectedAssetsLabel: string;
  stateLabels: Record<'pending' | 'resolving' | 'ready' | 'error', string>;
  onClear: () => void;
  onRemove: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleAsset: (itemId: string, token: string) => void;
};

const kindLabel = (kind: 'video' | 'image' | 'audio', index: number) => `${kind.toUpperCase()} ${String(index + 1).padStart(2, '0')}`;

export const QueueList = ({
  items,
  title,
  clearLabel,
  emptyTitle,
  emptyHint,
  detailLabel,
  hideLabel,
  removeLabel,
  downloadLabel,
  selectedAssetsLabel,
  stateLabels,
  onClear,
  onRemove,
  onToggleExpand,
  onToggleAsset
}: QueueListProps) => (
  <section className="queue-list">
    <div className="queue-list__header">
      <div>
        <p className="eyebrow">QUEUE LIST</p>
        <h2>{title}</h2>
      </div>
      <div className="queue-list__controls">
        <span className="meta-badge">{items.length} ITEMS</span>
        <button type="button" className="text-button" onClick={onClear} disabled={items.length === 0}>
          {clearLabel}
        </button>
      </div>
    </div>

    {items.length === 0 ? (
      <div className="queue-empty">
        <QueueIcon className="queue-empty__icon" />
        <p className="queue-empty__title">{emptyTitle}</p>
        <p className="queue-empty__hint">{emptyHint}</p>
      </div>
    ) : (
      <div className="queue-rows">
        {items.map((item) => {
          const response = item.response;
          const assets = response?.assets ?? [];
          const thumbnail = response?.thumbnailUrl ?? assets[0]?.previewUrl;
          const itemPlatform = response?.platform ?? 'auto';
          const singleAsset = assets.length === 1 ? assets[0] : undefined;
          const titleText = response?.title ?? summarizeUrl(item.url);

          return (
            <article className={`queue-row status-${item.status}`} key={item.id}>
              <div className="queue-row__top">
                <div className="queue-row__thumb" aria-hidden="true">
                  {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <span>{platformLabel(itemPlatform).slice(0, 2)}</span>}
                </div>

                <div className="queue-row__main">
                  <h3 className="queue-row__title">{titleText}</h3>
                  <div className="queue-row__meta">
                    <span>{platformLabel(itemPlatform)}</span>
                    <span>{summarizeUrl(item.url)}</span>
                    <span>{assets.length > 0 ? `${assets.length} ASSETS` : 'UNRESOLVED'}</span>
                  </div>
                  {item.error ? <p className="queue-row__error">{item.error}</p> : null}
                </div>

                <div className="queue-row__side">
                  <span className={`status-pill status-pill--${item.status}`}>{stateLabels[item.status]}</span>
                  <div className="queue-row__actions">
                    {singleAsset ? (
                      <a className="icon-button" href={buildFileDownloadUrl(singleAsset.downloadToken)}>
                        <DownloadIcon className="button-icon" />
                        {downloadLabel}
                      </a>
                    ) : null}
                    {response ? (
                      <button type="button" className="icon-button" onClick={() => onToggleExpand(item.id)}>
                        <ChevronIcon className={`button-icon ${item.expanded ? 'is-open' : ''}`} />
                        {item.expanded ? hideLabel : detailLabel}
                      </button>
                    ) : null}
                    <button type="button" className="icon-button icon-button--ghost" onClick={() => onRemove(item.id)}>
                      <TrashIcon className="button-icon" />
                      {removeLabel}
                    </button>
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
                    {assets.map((asset, index) => {
                      const selected = item.selectedTokens.includes(asset.downloadToken);
                      return (
                        <div className={`asset-chip ${selected ? 'is-selected' : ''}`} key={asset.downloadToken}>
                          <button type="button" className="asset-chip__toggle" onClick={() => onToggleAsset(item.id, asset.downloadToken)}>
                            {kindLabel(asset.kind, index)}
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
