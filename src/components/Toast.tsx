import { useToastStore } from '../store/useToastStore';

export default function Toast() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'error' && '⚠'}
            {toast.type === 'success' && '✓'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
