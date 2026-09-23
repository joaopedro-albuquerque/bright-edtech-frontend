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

  // 1. Verificação inicial apenas para disparar o tour
  useEffect(() => {
    async function verificarTour() {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();
        const uid = session.tokens.idToken.payload.sub;

        const res = await fetch(`${API_BASE}/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-User-Id': uid 
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          // Ativa o tour se não estiver concluído
          if (!data.tour_concluido) {
            setTimeout(() => setRunTour(true), 500);
          }
        }
      } catch (error) {
        console.error('Erro na verificação inicial do tour:', error);
      }
    }
    verificarTour();
  }, []);

  // 2. Passos dinâmicos baseados na rota
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

  // 3. Callback 100% isolado: Busca o ID real na hora de fechar e evita o 403
  const handleJoyrideCallback = async (data) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);

      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();
        const uid = session.tokens.idToken.payload.sub;

        // PASSO A: Busca os dados em tempo real para garantir o UUID do banco
        const getRes = await fetch(`${API_BASE}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': uid
          }
        });

        if (!getRes.ok) throw new Error('Não foi possível obter o perfil atualizado.');
        
        const perfilDb = await getRes.json();
        const internalUserId = perfilDb.id; // O ID verdadeiro do banco gerado pelo FastAPI

        if (!internalUserId) throw new Error('ID interno não encontrado no payload da API.');

        // PASSO B: Monta o corpo exato que a API espera
        const payloadAtualizado = {
          email: perfilDb.email,
          nome: perfilDb.nome,
          estilo_preferido: perfilDb.estilo_preferido,
          formato_preferido: perfilDb.formato_preferido,
          objetivos_estudo: perfilDb.objetivos_estudo,
          cognito_id: perfilDb.cognito_id || uid
        };

        // PASSO C: Faz o PUT enviando o UUID interno na rota (passará no _garantir_dono)
        const putRes = await fetch(`${API_BASE}/profile/${internalUserId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': uid,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadAtualizado),
        });

        if (!putRes.ok) {
          const errDetalhe = await putRes.text();
          console.error(`Erro no PUT (${putRes.status}):`, errDetalhe);
        } else {
          console.log('Tour atualizado com sucesso no backend!');
        }

      } catch (error) {
        console.error('Falha na operação do tour:', error);
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
        styles={{
          options: {
            primaryColor: '#556b2f',
            zIndex: 10000
          }
        }}
      />

      {mobileOpen && (
        <div className="dl-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="dl-main">
        <div className="dl-topbar">
          <button
            className="dl-topbar__menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
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