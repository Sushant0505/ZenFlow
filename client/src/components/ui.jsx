import { useEffect } from 'react';

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

const CHIP = {
  Available: 'ok',
  Assigned: 'info',
  'Under Maintenance': 'warn',
  Paid: 'ok',
  Pending: 'bad',
  Open: 'warn',
  Resolved: 'ok',
};
export const Chip = ({ value }) => <span className={`chip ${CHIP[value] || ''}`}>{value}</span>;

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <span>{toast.text}</span>
      <button onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export const Empty = ({ children }) => <p className="empty">{children}</p>;
export const Loading = () => <p className="empty">Loading…</p>;
export const ErrorBox = ({ message, onRetry }) => (
  <div className="errorbox">
    <p>{message}</p>
    {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
  </div>
);
