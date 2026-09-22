import { useNavigate } from 'react-router-dom';
import './Metrics.css';

const metrics = [
  { value: '🤖', label: 'IA que organiza e resume por você' },
  { value: '⚡', label: 'Do PDF ao flashcard em segundos' },
  { value: '🎯', label: 'Revisão espaçada baseada em ciência' },
];

export default function Metrics() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/signup');
  };

  return (
    <section className="metrics">
      <div className="metrics__container">
        <p className="metrics__eyebrow">Comece agora</p>
        <h2 className="metrics__title">
          O futuro dos seus estudos<br />
          <span className="metrics__title-accent">começa aqui.</span>
        </h2>
        <p className="metrics__subtitle">
          Sem cadastro de cartão, sem enrolação. Suba seu primeiro material e veja a Bright em ação.
        </p>
        <div className="metrics__grid">
          {metrics.map((m, i) => (
            <div className="metrics__card" key={i}>
              <span className="metrics__card-value">{m.value}</span>
              <span className="metrics__card-label">{m.label}</span>
            </div>
          ))}
        </div>
        <button className="metrics__cta" onClick={handleCTA}>
          Começar Agora
        </button>
      </div>
    </section>
  );
}