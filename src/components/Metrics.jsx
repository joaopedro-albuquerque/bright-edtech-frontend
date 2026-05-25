import { useAuth } from 'react-oidc-context';
import './Metrics.css';

const metrics = [
  { value: '10k+', label: 'Flashcards Gerados' },
  { value: '500+', label: 'Documentos Gerados' },
  { value: '24/7', label: 'Organização Automática' },
];

export default function Metrics() {
  const auth = useAuth();

  const handleCTA = () => {
    auth.signinRedirect({ extraQueryParams: { screen_hint: 'signup' } });
  };

  return (
    <section className="metrics">
      <div className="metrics__container">
        <p className="metrics__eyebrow">Resultados reais</p>
        <h2 className="metrics__title">
          O futuro dos seus estudos<br />
          <span className="metrics__title-accent">começa aqui.</span>
        </h2>
        <p className="metrics__subtitle">
          Junte-se a quem já reduz o tempo de revisão e aprende com mais confiança.
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