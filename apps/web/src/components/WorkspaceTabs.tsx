import type { RequestedPlatform } from '@pixel/contracts';
import { platformLabel } from '../lib/utils';

type WorkspaceTabsProps = {
  value: RequestedPlatform;
  onChange: (value: RequestedPlatform) => void;
};

const options: RequestedPlatform[] = ['auto', 'instagram', 'threads', 'tiktok'];

export const WorkspaceTabs = ({ value, onChange }: WorkspaceTabsProps) => (
  <div className="page-header__tabs tabs-shell" aria-label="Platform selector">
    <div className="tabs-strip">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? 'workspace-tab workspace-tab--active' : 'workspace-tab'}
          onClick={() => onChange(option)}
        >
          {platformLabel(option)}
        </button>
      ))}
    </div>
  </div>
);
