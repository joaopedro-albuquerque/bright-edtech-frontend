import { useAuth } from 'react-oidc-context';
import './Feature.css';
import ImgFeature from '../assets/Img-feature.png';

const features = [
  {
    icon: '📁',
    title: 'Organização inteligente de estudos',
    description: 'Seus PDFs ficam organizados e fáceis de revisar, sem perder tempo com pastas confusas.',
  },
  {
    icon: '🃏',
    title: 'Flashcards automáticos',
    description: 'Revise o que importa com cartões criados a partir dos seus próprios arquivos.',
  },
  {
    icon: '📝',
    title: 'Resumos estratégicos',
    description: 'Receba os pontos-chave de cada documento em frases claras e fáceis de lembrar.',
  },
];

export default function Feature() {
  const auth = useAuth();

  const handleCTA = () => {
    auth.signinRedirect({ extraQueryParams: { screen_hint: 'signup' } });
  };

  return (
    <section className="feature">
      <div className="feature__container">
        <div className="feature__text">
          <p className="feature__eyebrow">Ecossistema completo</p>
          <h2 className="feature__title">
            Sua base de conhecimento,<br />
            <span className="feature__title-accent">agora inteligente.</span>
          </h2>
          <p className="feature__description">
            A Bright EdTech foi criada para quem quer estudar com menos esforço e
            mais foco. Aqui você organiza seus materiais automaticamente, cria revisões
            instantâneas e transforma PDFs em ferramentas de estudo práticas.
          </p>
          <ul className="feature__list">
            {features.map((f, i) => (
              <li className="feature__list-item" key={i}>
                <span className="feature__list-icon">{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="feature__cta" onClick={handleCTA}>
            Experimentar agora
          </button>
        </div>
        <div className="feature__illustration">
          <div className="feature__illustration-card feature__illustration-card--main">
            <img
              src={ImgFeature}
              alt="Plataforma Bright EdTech em uso"
            />
          </div>
          <div className="feature__illustration-card feature__illustration-card--float feature__illustration-card--float1">
            <span>📄</span> PDF carregado
          </div>
          <div className="feature__illustration-card feature__illustration-card--float feature__illustration-card--float2">
            <span>✅</span> Flashcard gerado
          </div>
        </div>
      </div>
    </section>
  );
}