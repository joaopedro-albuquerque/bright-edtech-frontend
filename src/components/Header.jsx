import { useAuth } from 'react-oidc-context';
import './Header.css';
import logoBright from '../assets/Logo-Edtech.png';

export default function Header() {
  const auth = useAuth();

  const handleLogin = () => {
    auth.signinRedirect();
  };

  const handleSignup = () => {
    auth.signinRedirect({ extraQueryParams: { screen_hint: 'signup' } });
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <img
            src={logoBright}
            alt="Bright EdTech Logo"
            className="header__logo-icon"
          />
          <span className="header__logo-text">
            BRIGHT<br /><span className="header__logo-sub">EDTECH</span>
          </span>
        </div>
        <nav className="header__nav">
          <button className="header__btn-login" onClick={handleLogin}>
            Login
          </button>
          <button className="header__btn-signup" onClick={handleLogin}>
            Cadastrar
          </button>
        </nav>
      </div>
    </header>
  );
}