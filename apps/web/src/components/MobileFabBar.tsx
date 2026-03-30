type MobileFabBarProps = {
  settingsLabel: string;
  resolveLabel: string;
  zipLabel: string;
  canResolve: boolean;
  canZip: boolean;
  onOpenSettings: () => void;
  onResolve: () => void;
  onDownloadZip: () => void;
};

export const MobileFabBar = ({
  settingsLabel,
  resolveLabel,
  zipLabel,
  canResolve,
  canZip,
  onOpenSettings,
  onResolve,
  onDownloadZip
}: MobileFabBarProps) => (
  <div className={`mobile-fab ${canZip ? 'has-zip' : ''}`}>
    <button type="button" className="secondary-button secondary-button--full" onClick={onOpenSettings}>
      {settingsLabel}
    </button>
    {canZip ? (
      <button type="button" className="secondary-button secondary-button--full" onClick={onDownloadZip}>
        {zipLabel}
      </button>
    ) : null}
    <button type="button" className="primary-button primary-button--full" onClick={onResolve} disabled={!canResolve}>
      {resolveLabel}
    </button>
  </div>
);
