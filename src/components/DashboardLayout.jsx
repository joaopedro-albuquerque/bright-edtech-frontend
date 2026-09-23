import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

import Joyride, { STATUS, EVENTS } from 'react-joyride';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_BASE } from '../config';

// Rotas que têm um passo de tour próprio. O tour só é marcado como
// concluído no backend depois que o usuário já viu (ou pulou) o mini-tour
// de todas elas — assim cada página chega a mostrar sua dica pelo menos uma vez.
const TOUR_ROUTES = ['/dashboard', '/documents', '/revisao-geral', '/profile'];
const TOUR_SEEN_STORAGE_KEY = 'brightedtech:tourSeenRoutes';
// Fallback local enquanto o backend não tem a coluna/flag `tour_concluido`.
// Assim que o backend passar a devolver esse campo, ele manda; até lá,
// usamos esta chave para lembrar que o usuário já concluiu o tour NESTA SESSÃO.
//
// Importante: usamos sessionStorage (não localStorage) de propósito. Por
// enquanto o tour deve rodar em toda sessão ativa — ou seja, a cada novo
// login (logout + login) o tour deve aparecer de novo. O sessionStorage já
// nos ajuda nisso (limpa ao fechar a aba), e o handleLogout do Sidebar
// também limpa essas chaves explicitamente para cobrir o caso de logout
// sem fechar a aba/navegador.
const TOUR_COMPLETED_STORAGE_KEY = 'brightedtech:tourCompletedLocally';

function getStepsForRoute(pathname) {
  switch (pathname) {
    case '/dashboard':
      return [
        {
          target: 'body',
          placement: 'center',
          disableBeacon: true,
          title: 'Bem-vindo ao Bright EdTech! 👋',
          content: 'Vamos fazer um tour rápido pelas principais áreas da plataforma.',
        },
        {
          target: '.tour-boas-vindas',
          disableBeacon: true,
          content: 'Este é o seu painel principal: aqui você acompanha os resumos, flashcards e quizzes gerados a partir dos seus materiais.',
        },
      ];
    case '/documents':
      return [
        {
          target: '.dp-header__actions',
          disableBeacon: true,
          content: 'Aqui você cria pastas para organizar seus documentos e envia novos arquivos para gerar resumos, flashcards e quizzes.',
        },
      ];
    case '/revisao-geral':
      return [
        {
          target: '.fq-header__title',
          disableBeacon: true,
          content: 'Aqui ficam todos os seus flashcards e quizzes gerados, prontos para revisão.',
        },
      ];
    case '/profile':
      return [
        {
          target: '.pf-header__name',
          disableBeacon: true,
          content: 'Aqui você gerencia o seu nome público e as configurações da sua conta.',
        },
      ];
    default:
      return [];
  }
}

function loadSeenRoutes() {
  try {
    const raw = sessionStorage.getItem(TOUR_SEEN_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function loadLocalTourCompleted() {
  try {
    return sessionStorage.getItem(TOUR_COMPLETED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveLocalTourCompleted() {
  try {
    sessionStorage.setItem(TOUR_COMPLETED_STORAGE_KEY, 'true');
  } catch { /* noop */ }
}

function clearLocalTourState() {
  try {
    sessionStorage.removeItem(TOUR_SEEN_STORAGE_KEY);
    sessionStorage.removeItem(TOUR_COMPLETED_STORAGE_KEY);
  } catch { /* noop */ }
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Estados do Tour
  const location = useLocation();
  const [tourDone, setTourDone] = useState(true); // true = não sabemos ainda, então não mostra nada
  const [seenRoutes, setSeenRoutes] = useState(loadSeenRoutes);
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const [cognitoSub, setCognitoSub] = useState(null);
  const [perfilCache, setPerfilCache] = useState({});

  // 1. Busca os dados iniciais do usuário e verifica se o tour já foi concluído
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
            'X-User-Id': uid,
          },
        });

        if (!res.ok) {
          setTourDone(loadLocalTourCompleted());
          return;
        }
        const data = await res.json();

        // Guarda os dados no cache para enviar depois no PUT
        setPerfilCache(data);

        // TODO(tour_concluido backend): quando o backend implementar a
        // coluna/flag `tour_concluido` em /profile, descomentar o bloco
        // abaixo para passar a confiar nela. Por enquanto ela fica sempre
        // desconsiderada (tratada como `false`) e o tour roda em toda
        // sessão ativa, controlado só pelo sessionStorage local.
        //
        // if (data.tour_concluido === undefined || data.tour_concluido === null) {
        //   setTourDone(loadLocalTourCompleted());
        // } else {
        //   const concluido = Boolean(data.tour_concluido);
        //   setTourDone(concluido);
        //   if (concluido) {
        //     // Backend já confirma como concluído: o estado local não é mais necessário
        //     clearLocalTourState();
        //   }
        // }
        setTourDone(loadLocalTourCompleted());
      } catch (error) {
        console.error('Erro ao verificar status do tour:', error);
        // Se não conseguimos confirmar com o backend, usamos o que sabemos localmente
        setTourDone(loadLocalTourCompleted());
      }
    }
    carregarStatusTour();
  }, []);

  // 2. Define os passos do tour para a rota atual
  useEffect(() => {
    setTourSteps(getStepsForRoute(location.pathname));
  }, [location.pathname]);

  // 3. Decide se o tour deve rodar: só roda em rotas com passos definidos,
  //    que ainda não foram vistas nesta "sessão" de onboarding.
  useEffect(() => {
    if (tourDone || tourSteps.length === 0 || seenRoutes.has(location.pathname)) {
      setRunTour(false);
      return;
    }
    const timer = setTimeout(() => setRunTour(true), 500);
    return () => clearTimeout(timer);
  }, [tourDone, tourSteps, location.pathname, seenRoutes]);

  // 4. Persiste localmente quais rotas já tiveram o tour visto/pulado
  useEffect(() => {
    try {
      localStorage.setItem(TOUR_SEEN_STORAGE_KEY, JSON.stringify([...seenRoutes]));
    } catch (error) {
      console.error('Erro ao salvar progresso local do tour:', error);
    }
  }, [seenRoutes]);

  // 5. Callback do Joyride: trata alvo não encontrado e conclusão/pulo do tour
  const handleJoyrideCallback = async (data) => {
    const { status, type } = data;

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Elemento ainda não montado (ex: página em loading) — não trava o tour,
      // o Joyride já pula automaticamente para o próximo passo.
      console.warn('[Tour] Elemento não encontrado para o passo:', data.step?.target);
      return;
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);

      const rotasVistas = new Set(seenRoutes).add(location.pathname);
      setSeenRoutes(rotasVistas);

      const faltaAlgumaRota = TOUR_ROUTES.some((rota) => !rotasVistas.has(rota));
      if (faltaAlgumaRota) return; // ainda há páginas com tour pendente

      // Usuário já viu (ou pulou) o tour em todas as páginas: marca como concluído
      setTourDone(true);
      // Grava localmente já de cara — funciona mesmo que o backend ainda não
      // tenha a coluna `tour_concluido`, e não precisa de mudança nenhuma aqui
      // quando ela for implementada (o passo 1 passa a confiar no backend).
      try {
        localStorage.removeItem(TOUR_SEEN_STORAGE_KEY);
      } catch { /* noop */ }
      saveLocalTourCompleted();

      // TODO(tour_concluido backend): quando o backend implementar a
      // coluna/flag `tour_concluido`, descomentar o bloco abaixo para
      // persistir a conclusão do tour por lá via PUT /profile. Enquanto
      // estiver comentado, a conclusão fica só no sessionStorage (ver
      // saveLocalTourCompleted acima) e o tour volta a aparecer a cada
      // novo login.
      //
      // if (!cognitoSub) return;
      // try {
      //   const session = await fetchAuthSession();
      //   const token   = session.tokens.idToken.toString();
      //
      //   // Mantemos o corpo de acordo com o UsuarioBase para não dar erro 422.
      //   const payloadAtualizado = {
      //     email: perfilCache.email || '',
      //     nome: perfilCache.nome || null,
      //     estilo_preferido: perfilCache.estilo_preferido || null,
      //     formato_preferido: perfilCache.formato_preferido || null,
      //     objetivos_estudo: perfilCache.objetivos_estudo || null,
      //     cognito_id: cognitoSub,
      //     tour_concluido: true,
      //   };
      //
      //   // A mágica: Apenas chamamos /profile. O backend faz o resto!
      //   const res = await fetch(`${API_BASE}/profile`, {
      //     method: 'PUT',
      //     headers: {
      //       'Authorization': `Bearer ${token}`,
      //       'X-User-Id': cognitoSub,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify(payloadAtualizado),
      //   });
      //
      //   if (!res.ok) {
      //     const err = await res.text();
      //     console.error('Falha ao salvar conclusão do tour:', res.status, err);
      //   } else {
      //     console.log('Tour concluído salvo com sucesso!');
      //   }
      //
      // } catch (error) {
      //   console.error('Erro ao enviar requisição do tour:', error);
      // }
    }
  };

  return (
    <div className={`dl-root${collapsed ? ' dl-root--collapsed' : ''}`}>
      <Joyride
        steps={tourSteps}
        run={runTour && tourSteps.length > 0}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        disableOverlayClose={true}
        scrollToFirstStep={true}
        callback={handleJoyrideCallback}
        floaterProps={{
          disableAnimation: false,
          styles: {
            floater: {
              transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular',
          nextLabelWithProgress: 'Próximo (Passo {step} de {steps})',
        }}
        styles={{
          options: {
            primaryColor: '#4A90D9',
            textColor: '#0a1535',
            arrowColor: '#ffffff',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(7, 13, 72, 0.55)',
            zIndex: 10000,
          },
          spotlight: {
            borderRadius: '10px',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          overlay: {
            transition: 'opacity 0.3s ease',
          },
          tooltip: {
            borderRadius: '14px',
            padding: '20px',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 6px 24px rgba(10, 21, 53, 0.16)',
          },
          tooltipTitle: {
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#0a1535',
            marginBottom: '4px',
          },
          tooltipContent: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.92rem',
            color: '#4a5568',
            lineHeight: 1.55,
            padding: '8px 0',
          },
          buttonNext: {
            backgroundColor: '#4A90D9',
            color: '#ffffff',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: '0.88rem',
            borderRadius: '8px',
            padding: '9px 16px',
            outline: 'none',
            transition: 'background-color 0.18s ease, transform 0.18s ease',
          },
          buttonBack: {
            color: '#6b7280',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: '0.88rem',
            marginRight: '8px',
          },
          buttonSkip: {
            color: '#6b7280',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
          },
          buttonClose: {
            color: '#6b7280',
          },
        }}
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