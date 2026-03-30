import type { AppSettings } from '../lib/types';
import { SettingsIcon } from './icons';

type SettingsPanelProps = {
  settings: AppSettings;
  labels: {
    configuration: string;
    contentMode: string;
    resultMode: string;
    tiktokMode: string;
    auto: string;
    videoOnly: string;
    imageOnly: string;
    singleFiles: string;
    zipBundle: string;
    preferNoWatermark: string;
    resolveQueue: string;
    downloadZip: string;
    clearWorkspace: string;
  };
  summary: {
    queueItems: number;
    readyItems: number;
    selectedAssets: number;
  };
  canResolve: boolean;
  canZip: boolean;
  isResolving: boolean;
  isArchiving: boolean;
  onChange: (next: Partial<AppSettings>) => void;
  onResolve: () => void;
  onDownloadZip: () => void;
  onClear: () => void;
};

const Segmented = <T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) => (
  <div className="segmented-control">
    {options.map((option) => (
      <button
        type="button"
        key={option.value}
        className={`segmented-control__option ${value === option.value ? 'is-active' : ''}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const SettingsPanel = ({
  settings,
  labels,
  summary,
  canResolve,
  canZip,
  isResolving,
  isArchiving,
  onChange,
  onResolve,
  onDownloadZip,
  onClear
}: SettingsPanelProps) => (
  <section className="settings-panel" id="settings-panel">
    <div className="config-header">
      <SettingsIcon className="config-header__icon" />
      <div>
        <p className="eyebrow">{labels.configuration}</p>
        <h2>{labels.configuration}</h2>
      </div>
    </div>

    <div className="settings-block">
      <div className="settings-block__head">
        <span>{labels.contentMode}</span>
        <strong>{summary.readyItems} READY</strong>
      </div>
      <Segmented
        value={settings.contentMode}
        onChange={(value) => onChange({ contentMode: value })}
        options={[
          { value: 'auto', label: labels.auto },
          { value: 'video', label: labels.videoOnly },
          { value: 'image', label: labels.imageOnly }
        ]}
      />
    </div>

    <div className="settings-block">
      <div className="settings-block__head">
        <span>{labels.resultMode}</span>
        <strong>{summary.selectedAssets} SELECTED</strong>
      </div>
      <Segmented
        value={settings.resultMode}
        onChange={(value) => onChange({ resultMode: value })}
        options={[
          { value: 'single', label: labels.singleFiles },
          { value: 'zip', label: labels.zipBundle }
        ]}
      />
    </div>

    <div className="settings-block">
      <div className="settings-block__head">
        <span>{labels.tiktokMode}</span>
        <strong>{summary.queueItems} ITEMS</strong>
      </div>
      <button
        type="button"
        className={`toggle-row ${settings.preferNoWatermark ? 'is-active' : ''}`}
        onClick={() => onChange({ preferNoWatermark: !settings.preferNoWatermark })}
      >
        <span>{labels.preferNoWatermark}</span>
        <span className="toggle-row__value">{settings.preferNoWatermark ? 'ON' : 'OFF'}</span>
      </button>
    </div>

    <div className="action-stack">
      <button type="button" className="primary-button primary-button--full" onClick={onResolve} disabled={!canResolve || isResolving}>
        {isResolving ? `${labels.resolveQueue}...` : labels.resolveQueue}
      </button>
      <button type="button" className="secondary-button secondary-button--full" onClick={onDownloadZip} disabled={!canZip || isArchiving}>
        {isArchiving ? `${labels.downloadZip}...` : labels.downloadZip}
      </button>
      <button type="button" className="text-button text-button--center" onClick={onClear} disabled={summary.queueItems === 0}>
        {labels.clearWorkspace}
      </button>
    </div>
  </section>
);
