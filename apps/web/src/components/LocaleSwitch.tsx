import type { Locale } from '../lib/types';

type LocaleSwitchProps = {
  value: Locale;
  onChange: (value: Locale) => void;
};

export const LocaleSwitch = ({ value, onChange }: LocaleSwitchProps) => (
  <div className="pill-group pill-group--locale" aria-label="Locale switch">
    {(['zh', 'en'] as const).map((option) => (
      <button
        key={option}
        type="button"
        className={`pill-button ${value === option ? 'is-active' : ''}`}
        onClick={() => onChange(option)}
      >
        {option === 'zh' ? '中文' : 'EN'}
      </button>
    ))}
  </div>
);
