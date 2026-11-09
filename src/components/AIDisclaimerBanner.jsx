import './AIDisclaimerBanner.css';

/**
 * Aviso fixo de que o conteúdo foi gerado por IA e pode conter imprecisões.
 * Texto estático por decisão de produto — mudanças exigem redeploy do front,
 * aceitável para um aviso que praticamente não muda com o tempo.
 */
export default function AIDisclaimerBanner({ className = '' }) {
  return (
    <div className={`ai-disclaimer ${className}`} role="note">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.8" fill="currentColor" />
      </svg>
      <span>
        Conteúdo gerado por inteligência artificial. Pode conter imprecisões.
        Confira sempre com o material original antes de usar como única fonte de estudo.
      </span>
    </div>
  );
}
