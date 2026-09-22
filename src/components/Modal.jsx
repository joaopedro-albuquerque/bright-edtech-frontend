import { useEffect } from 'react';
import '../pages/DocumentsPage.css';

/**
 * Modal genérico reutilizável (usa as classes .dp-modal* de DocumentsPage.css).
 * Usado no Document Hub e na Dashboard.
 */
export default function Modal({ title, onClose, onConfirm, confirmLabel, confirmVariant = 'primary',
  isLoading, confirmDisabled = false, className = '', children }) {
  // Fecha com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="dp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`dp-modal${className ? ` ${className}` : ''}`}>
        <div className="dp-modal__header">
          <h2 className="dp-modal__title" id="modal-title">{title}</h2>
          <button className="dp-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="dp-modal__body">{children}</div>
        <div className="dp-modal__footer">
          <button className="dp-btn dp-btn--ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className={`dp-btn dp-btn--${confirmVariant}${isLoading ? ' dp-btn--loading' : ''}`}
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
          >
            {isLoading ? (
              <><span className="dp-btn-spinner" aria-hidden="true" />{confirmLabel}…</>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
