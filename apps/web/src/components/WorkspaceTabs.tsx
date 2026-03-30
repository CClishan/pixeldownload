import type { RequestedPlatform } from '@pixel/contracts';
import { platformLabel } from '../lib/utils';

type WorkspaceTabsProps = {
  value: RequestedPlatform;
  onChange: (value: RequestedPlatform) => void;
};

const options: RequestedPlatform[] = ['auto', 'instagram', 'threads', 'tiktok'];

export const WorkspaceTabs = ({ value, onChange }: WorkspaceTabsProps) => (
  <div className="control-shell" aria-label="Platform selector">
    <div className="control-pill-group">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`control-pill ${value === option ? 'is-active' : ''}`}
          onClick={() => onChange(option)}
        >
          {platformLabel(option)}
        </button>
      ))}
    </div>
  </div>
);
