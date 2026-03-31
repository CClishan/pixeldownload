import type { Locale } from '../lib/types';

type LocaleSwitchProps = {
  value: Locale;
  onChange: (value: Locale) => void;
};

export const LocaleSwitch = ({ value, onChange }: LocaleSwitchProps) => (
  <div className="page-header__locale" aria-label="Locale switch">
    {(['zh', 'en'] as const).map((option) => (
      <button
        key={option}
        type="button"
        className={value === option ? 'page-header__locale-button page-header__locale-button--active' : 'page-header__locale-button'}
        onClick={() => onChange(option)}
      >
        {option === 'zh' ? '中文' : 'EN'}
      </button>
    ))}
  </div>
);
