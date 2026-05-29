import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import './Sidebar.css';
import logoBright from '../assets/Logo-Edtech.png';

/* ── Ícones SVG inline (sem dependência externa) ── */
const icons = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  documents: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M10 1H4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 4 17h10a1.5 1.5 0 0 0 1.5-1.5V6.5L10 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 1v5.5h5.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  flashcards: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 4V3a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 17 3v10a1.5 1.5 0 0 1-1.5 1.5H15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 9h5M5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  quizzes: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.8 6.8a2.2 2.2 0 0 1 4.2.9c0 1.5-2.2 1.8-2.2 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="13.5" r="0.75" fill="currentColor"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 16c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  collapse: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L6 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const navItems = [
  { to: '/dashboard',   label: 'Visão Geral',                  icon: icons.overview   },
  { to: '/documents',   label: 'Gestão de Documentos', icon: icons.documents  },
  { to: '/flashcards',  label: 'Criação de Flashcards',         icon: icons.flashcards },
  { to: '/quizzes',     label: 'Gestão de Questionários', icon: icons.quizzes },
];

/* ── Dados do usuário — futuramente virão do contexto/auth ── */
const mockUser = {
  name: 'Aluno Teste',
  plan: 'Plano Pro',
};

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
      setLoggingOut(false);
    }
  };

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`} aria-label="Menu lateral">

      {/* ── Cabeçalho: logo + botão de colapsar ── */}
      <div className="sidebar__header">
        {!collapsed && (
          <div className="sidebar__logo">
            <img
              src={logoBright}
              alt="Bright EdTech logo"
              className="sidebar__logo-icon"
            />
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-name">Bright</span>
              <span className="sidebar__logo-product">EdTech</span>
            </div>
          </div>
        )}

        <button
          className="sidebar__collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <span className={`sidebar__collapse-icon${collapsed ? ' sidebar__collapse-icon--rotated' : ''}`}>
            {icons.collapse}
          </span>
        </button>
      </div>

      {/* ── Divisor ── */}
      <div className="sidebar__divider" />

      {/* ── Navegação principal ── */}
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list" role="list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar__nav-icon">{item.icon}</span>
                {!collapsed && (
                  <span className="sidebar__nav-label">{item.label}</span>
                )}
                {!collapsed && (
                  <span className="sidebar__nav-arrow">{icons.chevron}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Rodapé: perfil + logout ── */}
      <div className="sidebar__footer">
        <div className="sidebar__divider" />

        <div className={`sidebar__profile${collapsed ? ' sidebar__profile--collapsed' : ''}`}>
          <div className="sidebar__avatar" title={collapsed ? mockUser.name : undefined}>
            {icons.user}
          </div>
          {!collapsed && (
            <div className="sidebar__profile-info">
              <span className="sidebar__profile-name">{mockUser.name}</span>
              <span className="sidebar__profile-plan">{mockUser.plan}</span>
            </div>
          )}
          {!collapsed && (
            <button
              className={`sidebar__logout-btn${loggingOut ? ' sidebar__logout-btn--loading' : ''}`}
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sair da conta"
              title="Sair"
            >
              {loggingOut
                ? <span className="sidebar__logout-spinner" aria-hidden="true" />
                : icons.logout}
            </button>
          )}
        </div>

        {/* Logout isolado quando colapsado */}
        {collapsed && (
          <button
            className="sidebar__logout-icon-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Sair da conta"
            title="Sair"
          >
            {loggingOut
              ? <span className="sidebar__logout-spinner" aria-hidden="true" />
              : icons.logout}
          </button>
        )}
      </div>
    </aside>
  );
}