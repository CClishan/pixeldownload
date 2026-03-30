import type { Toast } from '../lib/types';

type ToastRegionProps = {
  toasts: Toast[];
};

export const ToastRegion = ({ toasts }: ToastRegionProps) => (
  <div className="toast-region" aria-live="polite" aria-atomic="true">
    {toasts.map((toast) => (
      <div key={toast.id} className={`toast toast--${toast.tone}`}>
        {toast.message}
      </div>
    ))}
  </div>
);
