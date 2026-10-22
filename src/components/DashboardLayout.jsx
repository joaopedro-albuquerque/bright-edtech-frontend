import { useState, useEffect, useCallback, useRef } from 'react';
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
const TOUR_DOCS_CHAPTERS_KEY = 'brightedtech:tourDocsChapters';
const DOCS_TOUR_UNLOCK_EVENT = 'brightedtech:docs-tour-unlock';

/** Capítulos progressivos de /documents (usuário novo desbloqueia ao criar). */
const DOC_TOUR_CHAPTERS = ['create', 'folder', 'upload', 'file'];

/** Quanto tempo esperar a página “pronta” antes de filtrar com o que houver. */
const PAGE_READY_TIMEOUT_MS = 3000;

/** Seletor que indica que o conteúdo principal da rota já montou (pós-loading). */
const PAGE_READY_SELECTOR = {
  '/dashboard': '.tour-boas-vindas, .ov-error',
  '/documents': '.dp-grid, .dp-empty, .dp-file-list, [data-tour="dp-empty"], [data-tour="dp-header-actions"]',
  '/revisao-geral': '.fq-header__title',
  '/profile': '.pf-header__name',
};

function isTargetPresent(target) {
  return target === 'body' || Boolean(document.querySelector(target));
}

function getDocumentsChapterSteps(chapterId) {
  switch (chapterId) {
    case 'create':
      return [
        {
          target: '[data-tour="dp-empty"]',
          disableBeacon: true,
          content: 'Sua área de documentos ainda está vazia. Crie a primeira pasta para começar a organizar seus materiais.',
        },
        {
          target: '[data-tour="dp-new-folder"]',
          disableBeacon: true,
          content: 'Use Nova pasta (aqui ou no estado vazio) para criar sua primeira pasta de estudo.',
        },
      ];
    case 'folder':
      return [
        {
          target: '[data-tour="dp-folder-grid"]',
          disableBeacon: true,
          content: 'Suas pastas aparecem aqui. Use o menu (⋮) para renomear ou excluir.',
        },
        {
          target: '[data-tour="dp-first-folder"]',
          disableBeacon: true,
          content: 'Clique na pasta para abrir e ver a trilha de navegação, o upload e os arquivos dentro dela.',
        },
      ];
    case 'upload':
      return [
        {
          target: '[data-tour="dp-upload"]',
          disableBeacon: true,
          content: 'Pasta aberta e ainda sem arquivos: envie um documento com Enviar arquivo para gerar resumos, flashcards e quizzes.',
        },
      ];
    case 'file':
      return [
        {
          target: '[data-tour="dp-file-list"]',
          disableBeacon: true,
          content: 'Os arquivos da pasta ficam listados aqui.',
        },
        {
          target: '[data-tour="dp-file-ai"]',
          disableBeacon: true,
          content: 'Com o botão de IA você gera um novo resumo a partir deste documento.',
        },
        {
          target: '[data-tour="dp-file-counts"]',
          disableBeacon: true,
          content: 'Aqui você vê quantos resumos, flashcards e quizzes já existem e abre cada lista com um clique.',
        },
      ];
    default:
      return [];
  }
}

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
          disableScrolling: true,
          content: 'Use o menu lateral para navegar entre Visão Geral, Gestão de Documentos e Revisão Geral.',
        },
        {
          target: '[data-tour="sidebar-profile"]',
          placement: 'right',
          disableBeacon: true,
          disableScrolling: true,
          content: 'Aqui você acessa o seu perfil e, quando quiser, encerra a sessão com o botão de sair.',
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

/** Mantém só passos cujo alvo já existe no DOM (body sempre entra). */
function filterAvailableSteps(steps) {
  return steps.filter((step) => isTargetPresent(step.target));
}

function isPageReady(pathname) {
  const selector = PAGE_READY_SELECTOR[pathname];
  if (!selector) return true;
  return Boolean(document.querySelector(selector));
}

function loadSeenRoutes() {
  try {
    const raw = sessionStorage.getItem(TOUR_SEEN_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenRoutes(routes) {
  try {
    sessionStorage.setItem(TOUR_SEEN_STORAGE_KEY, JSON.stringify([...routes]));
  } catch (error) {
    console.error('Erro ao salvar progresso local do tour:', error);
  }
}

function loadDocsChapters() {
  try {
    const raw = sessionStorage.getItem(TOUR_DOCS_CHAPTERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDocsChapters(chapters) {
  try {
    sessionStorage.setItem(TOUR_DOCS_CHAPTERS_KEY, JSON.stringify([...chapters]));
  } catch { /* noop */ }
}

function allDocsChaptersDone(chapters) {
  return DOC_TOUR_CHAPTERS.every((id) => chapters.has(id));
}

/**
 * Marca capítulos que já não fazem sentido (ex.: conta que já tem pastas
 * não precisa do capítulo "create").
 */
function reconcileDocsChapters(done) {
  const next = new Set(done);
  const isEmptyRoot = Boolean(document.querySelector('[data-tour="dp-empty"]'));
  const hasFolders = Boolean(document.querySelector('[data-tour="dp-folder-grid"]'));
  const insideFolder = Boolean(document.querySelector('.dp-breadcrumb'));
  const hasFiles = Boolean(document.querySelector('[data-tour="dp-file-list"]'));

  if (!next.has('create') && !isEmptyRoot && (hasFolders || insideFolder || hasFiles)) {
    next.add('create');
  }
  if (!next.has('folder') && insideFolder) {
    next.add('folder');
  }
  if (!next.has('upload') && hasFiles) {
    next.add('upload');
  }
  return next;
}

/**
 * Escolhe o próximo capítulo de /documents desbloqueável pelo DOM atual.
 * Retorna null se não há capítulo a mostrar agora.
 */
function resolveDocumentsChapter(doneChapters) {
  const done = reconcileDocsChapters(doneChapters);
  const isEmptyRoot = Boolean(document.querySelector('[data-tour="dp-empty"]'));
  const hasFolders = Boolean(document.querySelector('[data-tour="dp-folder-grid"]'));
  const insideFolder = Boolean(document.querySelector('.dp-breadcrumb'));
  const hasFiles = Boolean(document.querySelector('[data-tour="dp-file-list"]'));
  const hasUploadBtn = Boolean(document.querySelector('[data-tour="dp-upload"]'));

  if (!done.has('create') && isEmptyRoot) return { id: 'create', done };
  if (!done.has('folder') && hasFolders && !insideFolder) return { id: 'folder', done };
  if (!done.has('upload') && insideFolder && !hasFiles && hasUploadBtn) return { id: 'upload', done };
  if (!done.has('file') && hasFiles) return { id: 'file', done };
  return { id: null, done };
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
    sessionStorage.removeItem(TOUR_DOCS_CHAPTERS_KEY);
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
  const [docsChapters, setDocsChapters] = useState(loadDocsChapters);
  const [activeDocsChapter, setActiveDocsChapter] = useState(null);
  const [cognitoSub, setCognitoSub] = useState(null);
  const [perfilCache, setPerfilCache] = useState({});
  const docsChapterRef = useRef(null);
  const docsChaptersRef = useRef(docsChapters);
  docsChaptersRef.current = docsChapters;
  // Lembra se foi o próprio tour que abriu o drawer mobile (pra fechar de
  // volta sozinho, sem mexer se o usuário tiver aberto o menu manualmente).
  const mobileOpenedByTourRef = useRef(false);

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

        // Backend já persiste tour_concluido em /profile (coluna usuarios.tour_concluido).
        if (data.tour_concluido === undefined || data.tour_concluido === null) {
          setTourDone(loadLocalTourCompleted());
        } else {
          const concluido = Boolean(data.tour_concluido);
          setTourDone(concluido);
          if (concluido) {
            // Backend já confirma como concluído: o estado local não é mais necessário
            clearLocalTourState();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do tour:', error);
        // Se não conseguimos confirmar com o backend, usamos o que sabemos localmente
        setTourDone(loadLocalTourCompleted());
      }
    }
    carregarStatusTour();
  }, []);

  // 3. Marca a rota atual como concluída e, se todas as rotas do tour já
  //    tiverem sido vistas, marca o tour inteiro como concluído.
  const finalizarTourDaRota = useCallback(() => {
    setRunTour(false);
    setTourSteps([]);
    setStepIndex(0);
    setActiveDocsChapter(null);
    docsChapterRef.current = null;
    if (mobileOpenedByTourRef.current) {
      setMobileOpen(false);
      mobileOpenedByTourRef.current = false;
    }
    setSeenRoutes((prev) => {
      const rotasVistas = new Set(prev).add(location.pathname);

      const faltaAlgumaRota = TOUR_ROUTES.some((rota) => !rotasVistas.has(rota));
      if (!faltaAlgumaRota) {
        setTourDone(true);
        try {
          sessionStorage.removeItem(TOUR_SEEN_STORAGE_KEY);
        } catch { /* noop */ }
        saveLocalTourCompleted();
      }

      return rotasVistas;
    });
  }, [location.pathname]);

  const documentsRouteComplete = allDocsChaptersDone(docsChapters)
    || seenRoutes.has('/documents');

  /** Inicia (ou reinicia) o capítulo de documentos desbloqueável agora. */
  const tryStartDocumentsChapter = useCallback(() => {
    if (tourDone || location.pathname !== '/documents') return;
    if (allDocsChaptersDone(docsChaptersRef.current) || seenRoutes.has('/documents')) return;
    if (docsChapterRef.current) return; // capítulo em andamento

    const { id, done } = resolveDocumentsChapter(docsChaptersRef.current);
    if (done.size !== docsChaptersRef.current.size) {
      docsChaptersRef.current = done;
      setDocsChapters(done);
      saveDocsChapters(done);
      if (allDocsChaptersDone(done)) {
        finalizarTourDaRota();
        return;
      }
    }
    if (!id) {
      setRunTour(false);
      setTourSteps([]);
      setStepIndex(0);
      return;
    }

    const steps = filterAvailableSteps(getDocumentsChapterSteps(id));
    if (steps.length === 0) return;

    docsChapterRef.current = id;
    setActiveDocsChapter(id);
    setTourSteps(steps);
    setStepIndex(0);
  }, [tourDone, location.pathname, seenRoutes, finalizarTourDaRota]);

  const finalizarCapituloDocumentos = useCallback(() => {
    const chapterId = docsChapterRef.current || activeDocsChapter;
    setRunTour(false);
    setTourSteps([]);
    setStepIndex(0);
    docsChapterRef.current = null;
    setActiveDocsChapter(null);

    if (!chapterId) return;

    setDocsChapters((prev) => {
      const next = new Set(prev).add(chapterId);
      docsChaptersRef.current = next;
      saveDocsChapters(next);
      if (allDocsChaptersDone(next)) {
        queueMicrotask(() => finalizarTourDaRota());
      } else {
        // Se o DOM já desbloqueou o próximo (ex.: pasta criada durante o capítulo), inicia já.
        queueMicrotask(() => tryStartDocumentsChapter());
      }
      return next;
    });
  }, [activeDocsChapter, finalizarTourDaRota, tryStartDocumentsChapter]);

  // 2. Espera a página ficar pronta e monta os passos (ou o capítulo de docs).
  useEffect(() => {
    setRunTour(false);
    setTourSteps([]);
    setStepIndex(0);
    docsChapterRef.current = null;
    setActiveDocsChapter(null);

    if (tourDone) return undefined;

    if (location.pathname === '/documents') {
      if (documentsRouteComplete) return undefined;

      let cancelled = false;
      let observer = null;
      let readyTimer = null;
      let safetyTimer = null;

      const aplicar = () => {
        if (cancelled) return;
        tryStartDocumentsChapter();
      };

      const tentarSePronto = () => {
        if (!isPageReady('/documents')) return false;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (safetyTimer) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }
        readyTimer = setTimeout(aplicar, 80);
        return true;
      };

      if (!tentarSePronto()) {
        observer = new MutationObserver(() => {
          tentarSePronto();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        safetyTimer = setTimeout(() => {
          if (cancelled) return;
          if (observer) {
            observer.disconnect();
            observer = null;
          }
          aplicar();
        }, PAGE_READY_TIMEOUT_MS);
      }

      return () => {
        cancelled = true;
        if (observer) observer.disconnect();
        if (readyTimer) clearTimeout(readyTimer);
        if (safetyTimer) clearTimeout(safetyTimer);
      };
    }

    if (seenRoutes.has(location.pathname)) {
      return undefined;
    }

    const candidatos = getStepsForRoute(location.pathname);
    if (candidatos.length === 0) {
      return undefined;
    }

    let cancelled = false;
    let observer = null;
    let readyTimer = null;
    let safetyTimer = null;

    const aplicarPassosFiltrados = () => {
      if (cancelled) return;
      const filtrados = filterAvailableSteps(candidatos);
      if (filtrados.length === 0) {
        finalizarTourDaRota();
        return;
      }
      setTourSteps(filtrados);
      setStepIndex(0);
    };

    const tentarAplicarSePronto = () => {
      if (!isPageReady(location.pathname)) return false;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      readyTimer = setTimeout(aplicarPassosFiltrados, 80);
      return true;
    };

    if (!tentarAplicarSePronto()) {
      observer = new MutationObserver(() => {
        tentarAplicarSePronto();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      safetyTimer = setTimeout(() => {
        if (cancelled) return;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        aplicarPassosFiltrados();
      }, PAGE_READY_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (readyTimer) clearTimeout(readyTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [
    tourDone,
    location.pathname,
    seenRoutes,
    documentsRouteComplete,
    finalizarTourDaRota,
    tryStartDocumentsChapter,
  ]);

  // Escuta unlocks da DocumentsPage (criar pasta / abrir / upload).
  useEffect(() => {
    if (tourDone || location.pathname !== '/documents' || documentsRouteComplete) {
      return undefined;
    }

    const onUnlock = () => {
      // Só inicia novo capítulo se não houver um em andamento.
      if (docsChapterRef.current) return;
      // Pequeno delay para o React pintar o DOM (grade, upload, lista).
      setTimeout(() => tryStartDocumentsChapter(), 120);
    };

    window.addEventListener(DOCS_TOUR_UNLOCK_EVENT, onUnlock);
    return () => window.removeEventListener(DOCS_TOUR_UNLOCK_EVENT, onUnlock);
  }, [tourDone, location.pathname, documentsRouteComplete, tryStartDocumentsChapter]);

  // 4. Exibe o passo atual. Microciclo run=false → remedir → run=true.
  useEffect(() => {
    if (tourDone || tourSteps.length === 0) {
      setRunTour(false);
      return undefined;
    }

    if (location.pathname !== '/documents' && seenRoutes.has(location.pathname)) {
      setRunTour(false);
      return undefined;
    }

    if (stepIndex >= tourSteps.length) {
      if (location.pathname === '/documents') {
        finalizarCapituloDocumentos();
      } else {
        finalizarTourDaRota();
      }
      return undefined;
    }

    const step = tourSteps[stepIndex];
    if (!isTargetPresent(step.target)) {
      setRunTour(false);
      setStepIndex((i) => i + 1);
      return undefined;
    }

    setRunTour(false);
    const isSidebarStep = typeof step.target === 'string'
      && (step.target.includes('sidebar') || step.target.includes('data-tour="sidebar'));
    // No mobile a sidebar é um drawer escondido fora da tela -- sem abrir
    // ela antes, o passo tentaria apontar pra um elemento invisível.
    if (isSidebarStep && typeof window !== 'undefined' && window.innerWidth <= 768 && !mobileOpen) {
      mobileOpenedByTourRef.current = true;
      setMobileOpen(true);
    }
    const delay = stepIndex === 0 ? 500 : (isSidebarStep ? 180 : 80);
    let raf1 = 0;
    let raf2 = 0;
    const timer = setTimeout(() => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setRunTour(true);
        });
      });
    }, delay);

    return () => {
      clearTimeout(timer);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [
    tourDone,
    tourSteps,
    stepIndex,
    location.pathname,
    seenRoutes,
    finalizarTourDaRota,
    finalizarCapituloDocumentos,
  ]);

  // 5. Persiste rotas vistas
  useEffect(() => {
    saveSeenRoutes(seenRoutes);
  }, [seenRoutes]);

  // 6. Callback do Joyride
  const handleJoyrideCallback = async (data) => {
    const { status, type, action, index } = data;

    if (type === EVENTS.STEP_AFTER) {
      setRunTour(false);
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      return;
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      setRunTour(false);
      setStepIndex((i) => i + 1);
      return;
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (location.pathname === '/documents') {
        finalizarCapituloDocumentos();
      } else {
        finalizarTourDaRota();
      }

      // Persiste a conclusão do tour no backend via PUT /profile/{id}.
      if (!perfilCache.id) return;
      try {
        const session = await fetchAuthSession();
        const token   = session.tokens.idToken.toString();

        const payloadAtualizado = {
          email: perfilCache.email || '',
          nome: perfilCache.nome || null,
          estilo_preferido: perfilCache.estilo_preferido || null,
          formato_preferido: perfilCache.formato_preferido || null,
          objetivos_estudo: perfilCache.objetivos_estudo || null,
          cognito_id: perfilCache.cognito_id || cognitoSub,
          tour_concluido: true,
        };

        const res = await fetch(`${API_BASE}/profile/${perfilCache.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': perfilCache.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadAtualizado),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error('Falha ao salvar conclusão do tour:', res.status, err);
        }
      } catch (error) {
        console.error('Erro ao enviar requisição do tour:', error);
      }
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
        scrollToFirstStep={false}
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
