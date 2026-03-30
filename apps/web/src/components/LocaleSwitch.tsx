import type { Locale } from '../lib/types';

type LocaleSwitchProps = {
  value: Locale;
  onChange: (value: Locale) => void;
};

export const LocaleSwitch = ({ value, onChange }: LocaleSwitchProps) => (
  <div className="control-shell page-header__locale" aria-label="Locale switch">
    <div className="control-pill-group control-pill-group--locale">
      {(['zh', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          className={`control-pill ${value === option ? 'is-active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option === 'zh' ? '中文' : 'EN'}
        </button>
      ))}
    </div>
  </div>
);
