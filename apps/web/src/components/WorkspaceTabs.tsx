import type { RequestedPlatform } from '@pixel/contracts';
import { platformLabel } from '../lib/utils';

type WorkspaceTabsProps = {
  value: RequestedPlatform;
  onChange: (value: RequestedPlatform) => void;
};

const options: RequestedPlatform[] = ['auto', 'instagram', 'threads', 'tiktok'];

export const WorkspaceTabs = ({ value, onChange }: WorkspaceTabsProps) => (
  <div className="pill-group" aria-label="Platform selector">
    {options.map((option) => (
      <button
        key={option}
        type="button"
        className={`pill-button ${value === option ? 'is-active' : ''}`}
        onClick={() => onChange(option)}
      >
        {platformLabel(option)}
      </button>
    ))}
  </div>
);
