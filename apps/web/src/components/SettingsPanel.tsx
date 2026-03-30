import { Archive, Download, Loader2 } from 'lucide-react';
import { Switch } from './ui/switch';
import type { AppSettings } from '../lib/types';

type SettingsPanelProps = {
  settings: AppSettings;
  labels: {
    configuration: string;
    platform: string;
    contentMode: string;
    resultMode: string;
    tiktokMode: string;
    allPlatforms: string;
    instagram: string;
    threads: string;
    tiktok: string;
    auto: string;
    videoOnly: string;
    imageOnly: string;
    singleFiles: string;
    zipBundle: string;
    preferNoWatermark: string;
    resolveQueue: string;
    downloadZip: string;
  };
  canResolve: boolean;
  canZip: boolean;
  isResolving: boolean;
  isArchiving: boolean;
  onChange: (next: Partial<AppSettings>) => void;
  onResolve: () => void;
  onDownloadZip: () => void;
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
  <div className="toggle-surface">
    {options.map((option) => (
      <button
        type="button"
        key={option.value}
        className={value === option.value ? 'toggle-button toggle-button--active' : 'toggle-button'}
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
  canResolve,
  canZip,
  isResolving,
  isArchiving,
  onChange,
  onResolve,
  onDownloadZip
}: SettingsPanelProps) => (
  <section className="settings-panel" id="settings-panel">
    <div className="control-block control-block--tight">
      <label className="output-format-label">{labels.platform}</label>
      <Segmented
        value={settings.platformLock}
        onChange={(value) => onChange({ platformLock: value })}
        options={[
          { value: 'auto', label: labels.allPlatforms },
          { value: 'instagram', label: labels.instagram },
          { value: 'threads', label: labels.threads },
          { value: 'tiktok', label: labels.tiktok }
        ]}
      />
    </div>

    <div className="control-block control-block--tight">
      <label className="output-format-label">{labels.contentMode}</label>
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

    <div className="control-block control-block--tight">
      <label className="output-format-label">{labels.resultMode}</label>
      <Segmented
        value={settings.resultMode}
        onChange={(value) => onChange({ resultMode: value })}
        options={[
          { value: 'single', label: labels.singleFiles },
          { value: 'zip', label: labels.zipBundle }
        ]}
      />
    </div>

    <div className="control-block control-block--tight">
      <label className="output-format-label">{labels.tiktokMode}</label>
      <div className="switch-row">
        <label className="switch-row__label" htmlFor="tiktok-no-watermark">
          {labels.preferNoWatermark}
        </label>
        <Switch
          id="tiktok-no-watermark"
          checked={settings.preferNoWatermark}
          onCheckedChange={(checked) => onChange({ preferNoWatermark: checked })}
        />
      </div>
    </div>

    <div className="control-section control-section--actions">
      <div className="settings-action-stack">
        <button type="button" className="primary-button primary-button--full" onClick={onResolve} disabled={!canResolve || isResolving}>
          {isResolving ? <Loader2 className="button-icon smooth-spin" strokeWidth={1.8} /> : <Archive className="button-icon" strokeWidth={1.8} />}
          {isResolving ? `${labels.resolveQueue}...` : labels.resolveQueue}
      </button>
      <button type="button" className="secondary-button secondary-button--full" onClick={onDownloadZip} disabled={!canZip || isArchiving}>
        <Download className="button-icon" strokeWidth={1.8} />
        {isArchiving ? `${labels.downloadZip}...` : labels.downloadZip}
      </button>
      </div>
    </div>
  </section>
);
