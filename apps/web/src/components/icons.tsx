import type { SVGProps } from 'react';

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.7,
  viewBox: '0 0 24 24'
};

export const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M9 12.5 7.2 14.3a3.4 3.4 0 1 0 4.8 4.8l3.4-3.4a3.4 3.4 0 0 0-4.8-4.8l-.6.6" />
    <path d="M15 11.5 16.8 9.7a3.4 3.4 0 0 0-4.8-4.8L8.6 8.3a3.4 3.4 0 0 0 4.8 4.8l.6-.6" />
  </svg>
);

export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M12 4v10" />
    <path d="m8.5 10.8 3.5 3.5 3.5-3.5" />
    <path d="M5 18h14" />
  </svg>
);

export const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" />
    <path d="M4.8 13.4v-2.8l2.1-.7.7-1.8-1-2 2-2 2 1 1.8-.7.7-2.1h2.8l.7 2.1 1.8.7 2-1 2 2-1 2 .7 1.8 2.1.7v2.8l-2.1.7-.7 1.8 1 2-2 2-2-1-1.8.7-.7 2.1h-2.8l-.7-2.1-1.8-.7-2 1-2-2 1-2-.7-1.8-2.1-.7Z" />
  </svg>
);

export const GlobeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 12h17" />
    <path d="M12 3a14.5 14.5 0 0 1 0 18" />
    <path d="M12 3a14.5 14.5 0 0 0 0 18" />
  </svg>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M5.5 7h13" />
    <path d="M9 7V5.5h6V7" />
    <path d="m7.5 7 .8 11h7.4l.8-11" />
    <path d="M10 10.2v4.8" />
    <path d="M14 10.2v4.8" />
  </svg>
);

export const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="m8 10 4 4 4-4" />
  </svg>
);

export const QueueIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...props}>
    <path d="M6 7h12" />
    <path d="M6 12h8" />
    <path d="M6 17h10" />
  </svg>
);
