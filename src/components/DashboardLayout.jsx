import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
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
          content: 'Vamos fazer um tour completo pelas principais áreas da plataforma. Você pode pular a qualquer momento.',
        },
        {
          target: '.tour-boas-vindas',
          disableBeacon: true,
          content: 'Este é o seu painel principal: aqui você acompanha os resumos, flashcards e quizzes gerados a partir dos seus materiais.',
        },
        {
          target: '.ov-header__upload-btn',
          disableBeacon: true,
          content: 'Use o Upload rápido para enviar um novo documento sem precisar navegar até a página de documentos.',
        },
        {
          target: '.ov-metrics-grid',
          disableBeacon: true,
          content: 'Aqui ficam as métricas gerais: total de flashcards, resumos e quizzes já gerados. Clique em qualquer cartão para ver a lista completa.',
        },
        {
          target: '.ov-quick-resumo-list',
          disableBeacon: true,
          content: 'A partir dos seus documentos mais recentes, você pode gerar um novo resumo com um clique, escolhendo o formato desejado.',
        },
        {
          target: '.ov-activity-grid',
          disableBeacon: true,
          content: 'Na atividade recente você encontra os últimos flashcards, resumos e quizzes criados, com acesso rápido para revisar cada um.',
        },
        {
          target: '.sidebar__nav',
          placement: 'right',
          disableBeacon: true,
          content: 'Use o menu lateral para navegar entre Visão Geral, Gestão de Documentos e Revisão Geral.',
        },
        {
          target: '.sidebar__profile',
          placement: 'right',
          disableBeacon: true,
          content: 'Aqui você acessa o seu perfil e, quando quiser, encerra a sessão com o botão de sair.',
        },
      ];
    case '/documents':
      return [
        {
          target: '.dp-header__actions',
          disableBeacon: true,
          content: 'Aqui você cria pastas para organizar seus documentos e envia novos arquivos para gerar resumos, flashcards e quizzes.',
        },
        {
          target: '.dp-breadcrumb',
          disableBeacon: true,
          content: 'Use a navegação de trilha para saber em qual pasta você está e voltar rapidamente para pastas anteriores.',
        },
        {
          target: '.dp-grid',
          disableBeacon: true,
          content: 'Suas pastas aparecem aqui. Clique para abrir, ou use o menu de opções (⋮) para renomear ou excluir.',
        },
        {
          target: '.dp-file-list',
          disableBeacon: true,
          content: 'Os arquivos de cada pasta ficam listados aqui. Use o botão de IA para gerar um novo resumo, ou os contadores para ver resumos, flashcards e quizzes já criados a partir do documento.',
        },
      ];
    case '/revisao-geral':
      return [
        {
          target: '.fq-header__title',
          disableBeacon: true,
          content: 'Aqui ficam todos os seus flashcards e quizzes gerados, prontos para revisão.',
        },
        {
          target: '.fq-header__actions',
          disableBeacon: true,
          content: 'Crie um novo Quiz ou Flashcard a partir de um documento já enviado. Quando houver itens atrasados para revisar, um aviso aparece aqui também.',
        },
        {
          target: '.fq-tabs',
          disableBeacon: true,
          content: 'Alterne entre as abas de Flashcards e Quizzes para ver cada tipo de conteúdo separadamente.',
        },
        {
          target: '.fq-lists',
          disableBeacon: true,
          content: 'Os itens são organizados entre "Atrasados", que precisam de revisão hoje, e "Em dia". Clique em Visualizar para estudar ou na lixeira para excluir.',
        },
      ];
    case '/profile':
      return [
        {
          target: '.pf-header__name',
          disableBeacon: true,
          content: 'Aqui você gerencia o seu nome público e as configurações da sua conta.',
        },
        {
          target: '.pf-card:not(.pf-card--danger)',
          disableBeacon: true,
          content: 'Em Informações pessoais você pode atualizar seu nome e sobrenome. O e-mail é somente leitura, pois está vinculado ao seu login.',
        },
        {
          target: '.pf-card--danger',
          disableBeacon: true,
          content: 'Na zona de perigo você pode excluir permanentemente a sua conta. Essa ação não pode ser desfeita.',
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
  // Índice do passo atual. O tour agora é controlado por nós (em vez de
  // deixado 100% a cargo do Joyride) justamente para poder "segurar" o
  // avanço quando o elemento-alvo do próximo passo ainda não existe na
  // tela, e só mostrar o card quando ele for criado.
  const [stepIndex, setStepIndex] = useState(0);
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

  // 2. Define os passos do tour para a rota atual e reinicia o índice
  useEffect(() => {
    setTourSteps(getStepsForRoute(location.pathname));
    setStepIndex(0);
  }, [location.pathname]);

  // 3. Marca a rota atual como concluída e, se todas as rotas do tour já
  //    tiverem sido vistas, marca o tour inteiro como concluído.
  const finalizarTourDaRota = useCallback(() => {
    setRunTour(false);
    setSeenRoutes((prev) => {
      const rotasVistas = new Set(prev).add(location.pathname);

      const faltaAlgumaRota = TOUR_ROUTES.some((rota) => !rotasVistas.has(rota));
      if (!faltaAlgumaRota) {
        setTourDone(true);
        try {
          localStorage.removeItem(TOUR_SEEN_STORAGE_KEY);
        } catch { /* noop */ }
        saveLocalTourCompleted();
      }

      return rotasVistas;
    });
  }, [location.pathname]);

  // 4. Decide se o tour deve rodar. Diferente de antes, aqui NÃO pulamos um
  //    passo só porque o elemento-alvo ainda não existe na tela (ex: página
  //    ainda carregando os dados). Em vez disso, escondemos o tour e ficamos
  //    observando o DOM; assim que o elemento for criado, o card aparece
  //    nele — sem pular etapas e sem travar o onboarding.
  useEffect(() => {
    if (tourDone || tourSteps.length === 0 || seenRoutes.has(location.pathname)) {
      setRunTour(false);
      return;
    }

    // Já passamos por todos os passos definidos para esta rota.
    if (stepIndex >= tourSteps.length) {
      finalizarTourDaRota();
      return;
    }

    const step = tourSteps[stepIndex];
    const alvoExiste = step.target === 'body' || Boolean(document.querySelector(step.target));

    if (alvoExiste) {
      // Pequena pausa só no primeiro passo, pra deixar a página assentar
      // antes do overlay aparecer.
      const delay = stepIndex === 0 ? 500 : 0;
      const timer = setTimeout(() => setRunTour(true), delay);
      return () => clearTimeout(timer);
    }

    // Elemento ainda não existe: escondemos o tour e esperamos, na própria
    // sessão, ele ser criado (ex: dado terminando de carregar). Assim que
    // aparecer no DOM, o Joyride mostra o card sobre ele.
    setRunTour(false);
    const observer = new MutationObserver(() => {
      if (document.querySelector(step.target)) {
        observer.disconnect();
        setRunTour(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [tourDone, tourSteps, stepIndex, location.pathname, seenRoutes, finalizarTourDaRota]);

  // 5. Persiste localmente quais rotas já tiveram o tour visto/pulado
  useEffect(() => {
    try {
      localStorage.setItem(TOUR_SEEN_STORAGE_KEY, JSON.stringify([...seenRoutes]));
    } catch (error) {
      console.error('Erro ao salvar progresso local do tour:', error);
    }
  }, [seenRoutes]);

  // 6. Callback do Joyride: avança/volta o nosso índice controlado e trata
  //    a conclusão/pulo do tour.
  const handleJoyrideCallback = async (data) => {
    const { status, type, action, index } = data;

    if (type === EVENTS.STEP_AFTER) {
      // Avança ou volta o passo. O efeito acima cuida de esperar o próximo
      // alvo existir antes de exibir o card.
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      return;
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Segurança extra: como já checamos a existência do alvo antes de
      // rodar o tour, isso não deveria disparar. Se disparar mesmo assim,
      // apenas escondemos e deixamos o efeito de espera assumir de novo.
      setRunTour(false);
      return;
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      finalizarTourDaRota();

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
        stepIndex={stepIndex}
        run={runTour && tourSteps.length > 0}
        continuous={true}
        showSkipButton={true}
        showProgress={false}
        disableOverlayClose={true}
        scrollToFirstStep={true}
        callback={handleJoyrideCallback}
        floaterProps={{
          // Desliga a animação padrão do react-floater (que desliza/transforma
          // o card de uma posição pra outra). O card já nasce posicionado em
          // cima da área destacada e só faz um fade-in (ver .react-joyride__tooltip
          // em DashboardLayout.css).
          disableAnimation: true,
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular',
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
            // Sem transição de posição/tamanho: o recorte já nasce certo em
            // cima do elemento de cada passo, sem "arrastar" de um lugar pro
            // outro (era isso que deixava o passo do perfil com o recorte
            // errado, herdando por um instante o tamanho do passo anterior).
            transition: 'none',
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