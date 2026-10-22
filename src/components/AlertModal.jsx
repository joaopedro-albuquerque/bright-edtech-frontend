import { useEffect } from 'react';
import './AlertModal.css';

export default function AlertModal({ title, message, onClose, buttonLabel = 'Entendi' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="am-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="am-title"
      aria-describedby="am-message"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="am-modal">
        <div className="am-modal__icon" aria-hidden="true">!</div>
        <h2 className="am-modal__title" id="am-title">{title}</h2>
        <p className="am-modal__message" id="am-message">{message}</p>
        <button className="am-modal__btn" onClick={onClose} autoFocus>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
