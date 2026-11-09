import './Footer.css';
import logoBright from '../assets/Logo-Edtech.png';

const navLinks = [
  { label: 'Início', href: '#' },
  { label: 'Funcionalidades', href: '#feature' },
  { label: 'Quem somos', href: '#team' },
  { label: 'Tecnologia', href: '#tech' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <div className="footer__logo">
            <img
             src={logoBright}
              alt="Bright EdTech Logo"
              className="footer__logo-icon"
            />
            <span className="footer__logo-text">
              BRIGHT <span className="footer__logo-accent">EDTECH</span>
            </span>
          </div>
          <p className="footer__tagline">
            Transformando materiais brutos em inteligência acadêmica. O ecossistema completo para o estudante moderno.
          </p>
          <p className="footer__dev-note">
            Projeto desenvolvido para fins acadêmicos no curso de Análise e Desenvolvimento de Sistemas.
          </p>
        </div>
        <nav className="footer__nav" aria-label="Navegação do rodapé">
          <p className="footer__nav-title">Explore</p>
          <ul className="footer__nav-list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="footer__nav-link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="footer__bottom">
        <p>© {year} Bright EdTech</p>
      </div>
    </footer>
  );
}