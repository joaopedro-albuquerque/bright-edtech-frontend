import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

// 1. Importações do Joyride, Amplify e Config
import Joyride, { STATUS } from 'react-joyride';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_BASE } from '../config';

/**
 * DashboardLayout
 * Envolve todas as páginas internas da plataforma.
 */
export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- Estados do Tour ---
  const location = useLocation();
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const [userId, setUserId] = useState(null);

  // 2. Busca no banco de dados se o usuário já fez o tour
  useEffect(() => {
    async function carregarStatusTour() {
      try {
        const session = await fetchAuthSession();
        const token   = session.tokens.idToken.toString();
        const uid     = session.tokens.idToken.payload.sub;
        setUserId(uid);

        const res = await fetch(`${API_BASE}/profile/${uid}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-User-Id': uid // <-- Cabeçalho obrigatório exigido pelo backend
          },
        });
        
        if (!res.ok) return;
        const data = await res.json();

        // Ativa o tour se a coluna for falsa ou inexistente
        if (!data.tour_concluido) {
          setTimeout(() => setRunTour(true), 500);
        }
      } catch (error) {
        console.error('Erro ao verificar status do tour:', error);
        setTimeout(() => setRunTour(true), 500);
      }
    }
    carregarStatusTour();
  }, []);

  // 3. Define os passos dinamicamente com base na página atual
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setTourSteps([
        {
          target: '.dl-topbar__brand',
          content: 'Bem-vindo ao Bright EdTech! A sua jornada começa aqui.',
          disableBeacon: true
        },
        {
          target: '.tour-boas-vindas',
          content: 'Este é o seu painel principal de estudos.'
        }
      ]);
    } else if (location.pathname === '/documents') {
      setTourSteps([
        {
          target: '.tour-upload-btn',
          content: 'Faça o upload dos seus PDFs por aqui.'
        }
      ]);
    } else if (location.pathname === '/profile') {
      setTourSteps([
        {
          target: '.pf-header__name',
          content: 'Aqui você gerencia o seu nome público e configurações de conta.'
        }
      ]);
    } else {
      setTourSteps([]);
    }
  }, [location.pathname]);

  // 4. Salva no banco de dados quando o usuário pula ou finaliza
  const handleJoyrideCallback = async (data) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);

      if (userId) {
        try {
          const session = await fetchAuthSession();
          const token   = session.tokens.idToken.toString();
          const uid     = session.tokens.idToken.payload.sub;

          await fetch(`${API_BASE}/profile/${uid}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-User-Id': uid, // <-- Cabeçalho obrigatório exigido pelo backend
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tour_concluido: true }),
          });
        } catch (error) {
          console.error('Erro ao salvar conclusão do tour:', error);
        }
      }
    }
  };

  return (
    <div className={`dl-root${collapsed ? ' dl-root--collapsed' : ''}`}>

      {/* 5. Injeção do Componente Global */}
      <Joyride
        steps={tourSteps}
        run={runTour && tourSteps.length > 0}
        continuous={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#556b2f',
            zIndex: 10000
          }
        }}
      />

      {/* Overlay mobile (fecha ao clicar fora) */}
      {mobileOpen && (
        <div
          className="dl-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Área de conteúdo principal */}
      <main className="dl-main">
        {/* Topbar mobile */}
        <div className="dl-topbar">
          <button
            className="dl-topbar__menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <span className="dl-topbar__brand">Bright EdTech</span>
        </div>

        {/* Conteúdo da página atual (via React Router <Outlet>) */}
        <div className="dl-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}