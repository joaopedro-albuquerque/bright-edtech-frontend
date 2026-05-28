import { useNavigate } from 'react-router-dom';
import './Pricing.css';

const plans = [
  {
    id: 'freemium',
    name: 'Freemium',
    label: null,
    price: 'Grátis',
    priceNote: 'para sempre',
    features: [
      'Organização básica de arquivos',
      'Flashcards limitados por mês',
      'Acesso à comunidade',
    ],
    cta: 'Começar grátis',
    ctaVariant: 'outline',
    highlight: false,
  },
  {
    id: 'plus',
    name: 'Bright Plus',
    label: 'Mais popular',
    price: 'R$49',
    priceNote: '/mês',
    features: [
      'Tudo do Freemium +',
      'Geração ilimitada de cartões',
      'Modo Offline e foco em nichos',
    ],
    cta: 'Assinar agora',
    ctaVariant: 'solid',
    highlight: true,
  },
  {
    id: 'institucional',
    name: 'Institucional',
    label: null,
    price: 'Custom',
    priceNote: 'por turma',
    features: [
      'Licenças em volume para universidades',
      'Dashboards de atenção para gestores',
      'Segurança de dados',
    ],
    cta: 'Falar com Consultor',
    ctaVariant: 'outline',
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  const handlePlanCTA = () => {
    navigate('/login');
  };

  return (
    <section className="pricing">
      <div className="pricing__bg-glow" aria-hidden="true" />
      <div className="pricing__container">
        <p className="pricing__eyebrow">Planos</p>
        <h2 className="pricing__title">
          Planos flexíveis que cabem<br />
          <span className="pricing__title-accent">na sua rotina.</span>
        </h2>
        <div className="pricing__grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing__card ${plan.highlight ? 'pricing__card--highlight' : ''}`}
            >
              {plan.label && (
                <span className="pricing__card-badge">{plan.label}</span>
              )}
              <h3 className={`pricing__card-name ${plan.highlight ? 'pricing__card-name--accent' : ''}`}>
                {plan.name}
              </h3>
              <div className="pricing__card-price">
                <span className="pricing__card-amount">{plan.price}</span>
                <span className="pricing__card-period">{plan.priceNote}</span>
              </div>
              <ul className="pricing__card-features">
                {plan.features.map((f, i) => (
                  <li key={i} className="pricing__card-feature">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="7" fill={plan.highlight ? '#ffffff' : '#4A90D9'} fillOpacity="0.15"/>
                      <path d="M4 7l2 2 4-4" stroke={plan.highlight ? '#ffffff' : '#4A90D9'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`pricing__card-cta pricing__card-cta--${plan.ctaVariant} ${plan.highlight ? 'pricing__card-cta--inverted' : ''}`}
                onClick={() => handlePlanCTA(plan.id)}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}