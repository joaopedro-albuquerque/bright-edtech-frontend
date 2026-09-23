import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

import Joyride, { STATUS } from 'react-joyride';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_BASE } from '../config';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Estados do Tour
  const location = useLocation();
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const [cognitoSub, setCognitoSub] = useState(null);
  const [perfilCache, setPerfilCache] = useState({});

  // 1. Busca os dados iniciais do usuário
  useEffect(() => {
    async function carregarStatusTour() {
      try {
        const session = await fetchAuthSession();
        const token   = session.tokens.idToken.toString();
        const uid     = session.tokens.idToken.payload.sub;
        setCognitoSub(uid);

        const res = await fetch(`${API_BASE}/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-User-Id': uid 
          },
        });
        
        if (!res.ok) return;
        const data = await res.json();

        // Guarda os dados no cache para enviar depois no PUT
        setPerfilCache(data);

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

  // 2. Define os passos do tour
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setTourSteps([
        { target: '.dl-topbar__brand', content: 'Bem-vindo ao Bright EdTech! A sua jornada começa aqui.', disableBeacon: true },
        { target: '.tour-boas-vindas', content: 'Este é o seu painel principal de estudos.' }
      ]);
    } else if (location.pathname === '/documents') {
      setTourSteps([
        { target: '.tour-upload-btn', content: 'Faça o upload dos seus PDFs por aqui.' }
      ]);
    } else if (location.pathname === '/profile') {
      setTourSteps([
        { target: '.pf-header__name', content: 'Aqui você gerencia o seu nome público e configurações de conta.' }
      ]);
    } else {
      setTourSteps([]);
    }
  }, [location.pathname]);

  // 3. O PUT perfeito: sem ID na URL e sem risco de 403
  const handleJoyrideCallback = async (data) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);

      if (cognitoSub) {
        try {
          const session = await fetchAuthSession();
          const token   = session.tokens.idToken.toString();

          // Mantemos o corpo de acordo com o UsuarioBase para não dar erro 422
          const payloadAtualizado = {
            email: perfilCache.email || '',
            nome: perfilCache.nome || null,
            estilo_preferido: perfilCache.estilo_preferido || null,
            formato_preferido: perfilCache.formato_preferido || null,
            objetivos_estudo: perfilCache.objetivos_estudo || null,
            cognito_id: cognitoSub,
          };

          // A mágica: Apenas chamamos /profile. O backend faz o resto!
          const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-User-Id': cognitoSub,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadAtualizado),
          });

          if (!res.ok) {
            const err = await res.text();
            console.error('Falha ao salvar conclusão do tour:', res.status, err);
          } else {
            console.log('Tour concluído salvo com sucesso!');
          }

        } catch (error) {
          console.error('Erro ao enviar requisição do tour:', error);
        }
      }
    }
  };

  return (
    <div className={`dl-root${collapsed ? ' dl-root--collapsed' : ''}`}>
      <Joyride
        steps={tourSteps}
        run={runTour && tourSteps.length > 0}
        continuous={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{ options: { primaryColor: '#556b2f', zIndex: 10000 } }}
      />
      {mobileOpen && <div className="dl-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="dl-main">
        <div className="dl-topbar">
          <button className="dl-topbar__menu-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <span className="dl-topbar__brand">Bright EdTech</span>
        </div>
        <div className="dl-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}