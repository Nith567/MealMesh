'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, PcWarning } from 'iconoir-react';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

interface ToastContextType {
  toast: {
    success: (config: { title: string; description?: string; duration?: number }) => void;
    error: (config: { title: string; description?: string; duration?: number }) => void;
    info: (config: { title: string; description?: string; duration?: number }) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    title: string,
    type: 'success' | 'error' | 'info',
    description?: string,
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, title, description, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (config: { title: string; description?: string; duration?: number }) =>
      addToast(config.title, 'success', config.description, config.duration),
    error: (config: { title: string; description?: string; duration?: number }) =>
      addToast(config.title, 'error', config.description, config.duration),
    info: (config: { title: string; description?: string; duration?: number }) =>
      addToast(config.title, 'info', config.description, config.duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} setToasts={setToasts} />
    </ToastContext.Provider>
  );
};

export const Toaster = ({
  toasts,
  setToasts,
}: {
  toasts: ToastMessage[];
  setToasts: (toasts: ToastMessage[]) => void;
}) => {
  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-right-5 duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {toast.type === 'error' && (
              <PcWarning className="w-5 h-5 text-red-600" />
            )}
            {toast.type === 'info' && (
              <PcWarning className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <p
              className={`font-semibold text-sm ${
                toast.type === 'success'
                  ? 'text-green-900'
                  : toast.type === 'error'
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}
            >
              {toast.title}
            </p>
            {toast.description && (
              <p
                className={`text-xs mt-1 ${
                  toast.type === 'success'
                    ? 'text-green-700'
                    : toast.type === 'error'
                    ? 'text-red-700'
                    : 'text-blue-700'
                }`}
              >
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={`flex-shrink-0 ${
              toast.type === 'success'
                ? 'text-green-600 hover:text-green-700'
                : toast.type === 'error'
                ? 'text-red-600 hover:text-red-700'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
