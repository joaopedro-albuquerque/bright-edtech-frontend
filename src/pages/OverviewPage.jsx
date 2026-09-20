import { useState, useEffect, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Link } from 'react-router-dom';
import './OverviewPage.css';
import { API_BASE } from '../config';

/* ─────────────────────────────────────────────
   ÍCONES SVG INLINE
───────────────────────────────────────────── */
const Icon = {
  flashcard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 8.5h5M4 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="5" y="2" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
    </svg>
  ),
  resumo: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11 2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L11 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M11 2v5.5H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 11h6M7 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  quiz: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7.5 7.8a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2-2.3 3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor"/>
    </svg>
  ),
  arrowRight: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  sparkle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  emptyBox: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 16h8l2 3h4l2-3h8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 10V7a6 6 0 0 1 12 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

/** Formata ISO → DD/MM/AAAA */
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Pega token e userId do Cognito */
async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token  = session.tokens.idToken.toString();
  const userId = session.tokens.idToken.payload.sub;
  return { token, userId };
}

/** Saudação dinâmica por horário */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function OverviewPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [userName,      setUserName]      = useState('Carregando...');
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState(null);

  /* ── Carrega o dashboard da API ── */
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();

      // 1. Busca perfil para obter o UUID do banco e o nome
      const resProf = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resProf.ok) throw new Error(`Erro ${resProf.status}: não foi possível carregar o perfil.`);
      const profData = await resProf.json();
      setUserName(profData.nome?.split(' ')[0] || 'Aluno');

      // 2. Usa o UUID do banco (profData.id) para chamar o dashboard
      const resDash = await fetch(`${API_BASE}/profile/${profData.id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resDash.ok) throw new Error(`Erro ${resDash.status}: não foi possível carregar o dashboard.`);
      const dashData = await resDash.json();
      setDashboardData(dashData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  /* ─── Desestrutura os dados com fallbacks seguros ─── */
  const {
    total_flashcards = 0,
    total_resumos    = 0,
    total_quizzes    = 0,
    ultimos_flashcards = [],
    ultimos_resumos    = [],
    ultimos_quizzes    = [],
  } = dashboardData ?? {};

  const metrics = [
    {
      key:   'flashcards',
      label: 'Flashcards',
      value: total_flashcards,
      icon:  Icon.flashcard,
      color: 'blue',
      to:    '/flashcards',
    },
    {
      key:   'resumos',
      label: 'Resumos',
      value: total_resumos,
      icon:  Icon.resumo,
      color: 'indigo',
      to:    '/documents',
    },
    {
      key:   'quizzes',
      label: 'Quizzes',
      value: total_quizzes,
      icon:  Icon.quiz,
      color: 'violet',
      to:    '/quizzes',
    },
  ];

  /* ═══════════════════════════════════════════
     RENDER — LOADING
  ═══════════════════════════════════════════ */
  if (isLoading) {
    return (
      <div className="ov-root">
        <div className="ov-skeleton-header" />
        <div className="ov-metrics-grid">
          {[0,1,2].map(i => <div key={i} className="ov-skeleton-card" />)}
        </div>
        <div className="ov-activity-grid">
          {[0,1,2].map(i => <div key={i} className="ov-skeleton-panel" />)}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — ERRO
  ═══════════════════════════════════════════ */
  if (error) {
    return (
      <div className="ov-root">
        <div className="ov-error">
          <p className="ov-error__msg">⚠ {error}</p>
          <button className="ov-error__retry" onClick={loadDashboard}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — CONTEÚDO
  ═══════════════════════════════════════════ */
  return (
    <div className="ov-root">

      {/* ── Cabeçalho de boas-vindas ── */}
      <header className="ov-header">
        <div className="ov-header__greeting">
          <span className="ov-header__sparkle">{Icon.sparkle}</span>
          <span className="ov-header__time">{getGreeting()}</span>
        </div>
        <h1 className="ov-header__title">
          {userName}
        </h1>
        <p className="ov-header__sub">
          Sua IA já processou os novos materiais. Por onde vamos começar hoje?
        </p>
      </header>

      {/* ── Métricas ── */}
      <section aria-label="Métricas gerais">
        <div className="ov-metrics-grid">
          {metrics.map((m, i) => (
            <Link
              key={m.key}
              to={m.to}
              className={`ov-metric ov-metric--${m.color}`}
              style={{ animationDelay: `${i * 0.07}s` }}
              aria-label={`${m.value} ${m.label}`}
            >
              <div className="ov-metric__top">
                <span className="ov-metric__icon">{m.icon}</span>
                <span className="ov-metric__arrow">{Icon.arrowRight}</span>
              </div>
              <span className="ov-metric__value">
                {m.value.toLocaleString('pt-BR')}
              </span>
              <span className="ov-metric__label">{m.label}</span>
              <div className="ov-metric__glow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Atividade Recente ── */}
      <section aria-label="Atividade recente">
        <h2 className="ov-section-title">Atividade recente</h2>
        <div className="ov-activity-grid">

          {/* Flashcards recentes */}
          <ActivityPanel
            title={<>Últimos<br />Flashcards</>}
            icon={Icon.flashcard}
            color="blue"
            ctaLabel="Ver todos"
            ctaTo="/flashcards"
            emptyLabel="Nenhum flashcard recente"
            emptyHint="Crie flashcards a partir dos seus documentos."
          >
            {ultimos_flashcards.map((item) => (
              <ActivityItem
                key={item.id}
                title={item.titulo ?? item.pergunta ?? 'Flashcard'}
                meta={formatDate(item.criado_em)}
                icon={Icon.clock}
              />
            ))}
          </ActivityPanel>

          {/* Resumos recentes */}
          <ActivityPanel
            title={<>Últimos<br />Resumos</>}
            icon={Icon.resumo}
            color="indigo"
            ctaLabel="Ver documentos"
            ctaTo="/documents"
            emptyLabel="Nenhum resumo recente"
            emptyHint="Envie um documento para gerar resumos automáticos."
          >
            {ultimos_resumos.map((item) => (
              <ActivityItem
                key={item.id}
                title={item.titulo ?? item.nome ?? 'Resumo'}
                meta={formatDate(item.criado_em)}
                icon={Icon.clock}
              />
            ))}
          </ActivityPanel>

          {/* Quizzes recentes */}
          <ActivityPanel
            title={<>Últimos<br />Quizzes</>}
            icon={Icon.quiz}
            color="violet"
            ctaLabel="Ver todos"
            ctaTo="/flashcards"
            emptyLabel="Nenhum quiz recente"
            emptyHint="Gere quizzes para testar seu conhecimento."
          >
            {ultimos_quizzes.map((item) => (
              <ActivityItem
                key={item.id}
                title={item.titulo ?? item.nome ?? 'Quiz'}
                meta={formatDate(item.criado_em)}
                icon={Icon.clock}
              />
            ))}
          </ActivityPanel>

        </div>
      </section>

    </div>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTE: painel de atividade recente
───────────────────────────────────────────── */
function ActivityPanel({ title, icon, color, ctaLabel, ctaTo,
                         emptyLabel, emptyHint, children }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <div className={`ov-panel ov-panel--${color}`}>
      {/* Cabeçalho do painel */}
      <div className="ov-panel__header">
        <span className={`ov-panel__icon ov-panel__icon--${color}`}>{icon}</span>
        <h3 className="ov-panel__title">{title}</h3>
        <Link to={ctaTo} className="ov-panel__cta">
          {ctaLabel} {Icon.arrowRight}
        </Link>
      </div>

      {/* Lista ou estado vazio */}
      <div className="ov-panel__body">
        {isEmpty ? (
          <div className="ov-panel__empty">
            <span className="ov-panel__empty-icon">{Icon.emptyBox}</span>
            <p className="ov-panel__empty-label">{emptyLabel}</p>
            <p className="ov-panel__empty-hint">{emptyHint}</p>
          </div>
        ) : (
          <ul className="ov-panel__list" role="list">
            {children}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTE: item de atividade
───────────────────────────────────────────── */
function ActivityItem({ title, meta, icon }) {
  return (
    <li className="ov-activity-item">
      <span className="ov-activity-item__title">{title}</span>
      <span className="ov-activity-item__meta">
        {icon}
        {meta}
      </span>
    </li>
  );
}