import type { RequestedPlatform } from '@pixel/contracts';
import { GlobeIcon } from './icons';
import { LocaleSwitch } from './LocaleSwitch';
import { WorkspaceTabs } from './WorkspaceTabs';
import type { Locale } from '../lib/types';

type HeaderShellProps = {
  locale: Locale;
  platformLock: RequestedPlatform;
  onLocaleChange: (value: Locale) => void;
  onPlatformChange: (value: RequestedPlatform) => void;
  title: string;
  subtitle: string;
};

export const HeaderShell = ({
  locale,
  platformLock,
  onLocaleChange,
  onPlatformChange,
  title,
  subtitle
}: HeaderShellProps) => (
  <header className="header-shell">
    <div>
      <p className="eyebrow">PIXEL FAMILY TOOL</p>
      <h1>{title}</h1>
      <p className="header-subtitle">{subtitle}</p>
    </div>
    <div className="header-actions">
      <WorkspaceTabs value={platformLock} onChange={onPlatformChange} />
      <div className="header-locale">
        <GlobeIcon className="header-locale__icon" />
        <LocaleSwitch value={locale} onChange={onLocaleChange} />
      </div>
    </div>
  </header>
);
