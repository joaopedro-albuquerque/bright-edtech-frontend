import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/signup');
  };

  return (
    <section className="hero">
      <div className="hero__bg-grid" aria-hidden="true" />
      <div className="hero__bg-glow hero__bg-glow--1" aria-hidden="true" />
      <div className="hero__bg-glow hero__bg-glow--2" aria-hidden="true" />
      <div className="hero__container">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Estudo com propósito
        </div>
        <h1 className="hero__title">
          Estude com eficiência e<br />
          <span className="hero__title-highlight">transforme tempo perdido</span><br />
          em conquistas com a Bright.
        </h1>
        <p className="hero__subtitle">
          Carregue seus materiais, organize-os automaticamente e gere flashcards e resumos
          inteligentes para revisar com eficiência.
        </p>
        <button className="hero__cta" onClick={handleCTA}>
          Começar o primeiro estudo
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p className="hero__cta-note">Sem necessidade de cartão de crédito</p>
      </div>
    </section>
  );
}