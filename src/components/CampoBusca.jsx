import './CampoBusca.css';

export default function CampoBusca({ valor, onChange, placeholder = 'Buscar pelo nome…', ariaLabel = 'Buscar', className = '' }) {
  return (
    <div className={`cb-wrap${className ? ` ${className}` : ''}`}>
      <svg className="cb-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        className="cb-input"
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
      />
      {valor && (
        <button type="button" className="cb-clear" onClick={() => onChange('')} aria-label="Limpar busca">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
