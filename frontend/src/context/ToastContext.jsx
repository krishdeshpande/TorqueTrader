import { useState, useCallback } from 'react';

let addToast;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}

export const toast = {
  success: (msg) => addToast?.(msg, 'success'),
  error:   (msg) => addToast?.(msg, 'error'),
  info:    (msg) => addToast?.(msg, 'info'),
};
