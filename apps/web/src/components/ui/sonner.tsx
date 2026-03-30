import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    position="top-center"
    toastOptions={{
      unstyled: false,
      classNames: {
        toast: 'sonner-toast',
        title: 'sonner-toast__title',
        description: 'sonner-toast__description',
        success: 'sonner-toast--success',
        error: 'sonner-toast--error',
        info: 'sonner-toast--info'
      }
    }}
    {...props}
  />
);
