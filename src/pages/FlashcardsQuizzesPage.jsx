import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './FlashcardsQuizzesPage.css';
import { API_BASE } from '../config';
import StudyModal from '../components/StudyModal';
import AIDisclaimerBanner from '../components/AIDisclaimerBanner';
import AlertModal from '../components/AlertModal';
import GeneratingOverlay from '../components/GeneratingOverlay';
import { QUANTIDADES, QUANTIDADE_PADRAO } from '../constants/geracao';
import CampoBusca from '../components/CampoBusca';
import { useDocumentosBusca } from '../hooks/useDocumentosBusca';

/* ─────────────────────────────────────────────
   ÍCONES
───────────────────────────────────────────── */
const Icon = {
  flashcard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 8.5h5M4 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="5" y="2" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
    </svg>
  ),
  quiz: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7.5 7.8a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2-2.3 3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 1H4a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5V6L9 1Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  folder: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.5 1.7h5.4A1.5 1.5 0 0 1 14.5 6.2v6.3A1.5 1.5 0 0 1 13 14H3.5A1.5 1.5 0 0 1 2 12.5v-8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  alert: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 4v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="6.5" cy="9.5" r="0.7" fill="currentColor"/>
    </svg>
  ),
  emptyBox: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 18h9l2.5 3.5h5L23 18h9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 10V7a6 6 0 0 1 12 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  spinner: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fq-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  rotate: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8a6 6 0 1 0 1.2-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M2 4v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 2l9 5-9 5V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5h6.5L11 4"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens.idToken.toString();
  return { token };
}

async function getDbUserId(token) {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const profile = await res.json();
  return profile.id;
}

const ordemDocumento = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/* Agrupa os lotes pelo documento de origem, em ordem alfabética */
function agruparPorDocumento(lotes) {
  const grupos = new Map();
  for (const lote of lotes) {
    const chave = lote.documento_id ?? 'sem-documento';
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        chave,
        nome: lote.documento_nome ?? 'Documento removido',
        pasta: lote.pasta_caminho ?? null,
        lotes: [],
      });
    }
    grupos.get(chave).lotes.push(lote);
  }
  return [...grupos.values()].sort((a, b) => ordemDocumento.compare(a.nome, b.nome));
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function FlashcardsQuizzesPage() {
  // ── Dados principais ──
  const [flashcards,    setFlashcards]    = useState([]);
  const [quizzes,       setQuizzes]       = useState([]);
  const [abertos,       setAbertos]       = useState({});   // grupos expandidos/recolhidos pelo usuário
  const [dbUserId,      setDbUserId]      = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState(null);
  const [searchParams] = useSearchParams();
  const [activeTab,     setActiveTab]     = useState(
    searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'flashcards'
  );

  // ── Modal de criação ──
  const [showModal,      setShowModal]      = useState(null); // 'flashcard' | 'quiz'
  const [termoBusca,    setTermoBusca]    = useState('');
  const [selectedDocId,  setSelectedDocId]  = useState(null);
  const [isCreating,     setIsCreating]     = useState(false);
  const [modalError,     setModalError]     = useState('');
  const [actionError,    setActionError]    = useState(null);
  const [selectedDificuldade, setSelectedDificuldade] = useState('medio');
  const [selectedQuantidade, setSelectedQuantidade] = useState(QUANTIDADE_PADRAO);

  const montarHeaders = useCallback(async () => {
    const { token } = await getAuthHeaders();
    const id = dbUserId || await getDbUserId(token);
    return { Authorization: `Bearer ${token}`, 'X-User-Id': id };
  }, [dbUserId]);
  const busca = useDocumentosBusca({ termo: termoBusca, ativo: !!showModal, getHeaders: montarHeaders });

  // ── Modal de estudo ──
  const [studyItem, setStudyItem] = useState(null); // { id, titulo, tipo }

  // ── Exclusão ──
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, tipo, titulo }
  const [isDeleting,   setIsDeleting]   = useState(false);

  /* ── Carrega os lotes de flashcards e quizzes, com documento e contagem de vencidos ── */
  const load = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setIsLoading(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();
      const id = await getDbUserId(token);
      if (!id) throw new Error('Perfil não encontrado. Faça login novamente.');
      setDbUserId(id);

      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': id };
      const [resFC, resQZ] = await Promise.all([
        fetch(`${API_BASE}/revisoes/lotes?tipo=flashcards`, { headers }),
        fetch(`${API_BASE}/revisoes/lotes?tipo=quizzes`,    { headers }),
      ]);
      if (!resFC.ok || !resQZ.ok) throw new Error('Não foi possível carregar seus flashcards e quizzes.');

      setFlashcards(await resFC.json());
      setQuizzes(await resQZ.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Abre o modal; a lista de documentos vem da busca no servidor ── */
  const openModal = (type) => {
    setShowModal(type);
    setSelectedDocId(null);
    setModalError('');
    setTermoBusca('');
    setSelectedDificuldade('medio');
    setSelectedQuantidade(QUANTIDADE_PADRAO);
  };

  /* ── Confirma seleção e gera via Bedrock ── */
  const handleCreate = async () => {
    if (!selectedDocId) return;
    setIsCreating(true);
    setModalError('');
    try {
      const { token } = await getAuthHeaders();
      const id = dbUserId || await getDbUserId(token);
      const headers = {
        Authorization: `Bearer ${token}`,
        'X-User-Id': id,
        'Content-Type': 'application/json',
      };

      const endpoint = showModal === 'flashcard'
        ? `${API_BASE}/documentos/${selectedDocId}/flashcards`
        : `${API_BASE}/documentos/${selectedDocId}/quizzes`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ quantidade: selectedQuantidade, dificuldade: selectedDificuldade }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Erro ${res.status} ao gerar.`);
      }

      const created = await res.json();
      setActiveTab(showModal === 'flashcard' ? 'flashcards' : 'quizzes');
      setShowModal(null);
      setStudyItem({ id: created.id, titulo: created.titulo, tipo: showModal });
      load({ silencioso: true });
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Abre/fecha o modal de estudo (StudyModal cuida do proprio carregamento) ── */
  // Atrasados estudam só os cartões vencidos; em dia, o lote inteiro para revisão
  const openStudy = (lote, tipo, somenteVencidos) =>
    setStudyItem({ ...lote, titulo: lote.documento_nome ?? lote.titulo, tipo, somenteVencidos });
  const closeStudy = () => { setStudyItem(null); load({ silencioso: true }); };

  const closeModal = () => { if (!isCreating) setShowModal(null); };

  /* ── Exclui flashcard ou quiz ── */
  const deleteItem = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { token } = await getAuthHeaders();
      const id = dbUserId || await getDbUserId(token);
      const endpoint = deleteTarget.tipo === 'flashcard'
        ? `${API_BASE}/flashcards/${deleteTarget.id}`
        : `${API_BASE}/quizzes/${deleteTarget.id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': id },
      });
      if (!res.ok) throw new Error(`Erro ${res.status} ao excluir.`);
      if (deleteTarget.tipo === 'flashcard') {
        setFlashcards(prev => prev.filter(f => f.id !== deleteTarget.id));
      } else {
        setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Dados da tab ativa ── */
  const items     = activeTab === 'flashcards' ? flashcards : quizzes;
  const dueCount  = items.reduce((soma, lote) => soma + lote.itens_vencidos, 0);
  const atrasados = items.filter(lote => lote.itens_vencidos > 0);
  const emDia     = items.filter(lote => lote.itens_vencidos === 0);

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="fq-root">

      {/* ── Cabeçalho ── */}
      <header className="fq-header">
        <div>
          <h1 className="fq-header__title">Flashcards &amp; Quizzes</h1>
          <p className="fq-header__subtitle">
            Visualize seus flashcards e quizzes já criados e veja quais precisam de revisão hoje.
          </p>
        </div>

        <div className="fq-header__actions">
          {dueCount > 0 && (
            <div className="fq-review-alert">
              {Icon.alert}
              {dueCount} para revisar hoje
            </div>
          )}
          <button className="fq-btn fq-btn--secondary" onClick={() => openModal('quiz')}>
            {Icon.plus}
            Criar Quiz
          </button>
          <button className="fq-btn fq-btn--primary" onClick={() => openModal('flashcard')}>
            {Icon.plus}
            Criar Flashcard
          </button>
        </div>
      </header>

      <AIDisclaimerBanner className="fq-ai-disclaimer" />

      {/* ── Tabs ── */}
      <div className="fq-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'flashcards'}
          className={`fq-tab${activeTab === 'flashcards' ? ' fq-tab--active' : ''}`}
          onClick={() => setActiveTab('flashcards')}
        >
          {Icon.flashcard}
          Flashcards
          <span className="fq-tab__count">{flashcards.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'quizzes'}
          className={`fq-tab${activeTab === 'quizzes' ? ' fq-tab--active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          {Icon.quiz}
          Quizzes
          <span className="fq-tab__count">{quizzes.length}</span>
        </button>
      </div>

      {/* ── Lista ── */}
      {isLoading ? (
        <ul className="fq-list">
          {[0,1,2,3].map(i => <li key={i} className="fq-skeleton" />)}
        </ul>
      ) : error ? (
        <div className="fq-error">
          {error}
          <button className="fq-error__retry" onClick={() => load()}>Tentar novamente</button>
        </div>
      ) : items.length === 0 ? (
        <div className="fq-empty">
          <span className="fq-empty__icon">{Icon.emptyBox}</span>
          <p className="fq-empty__text">
            Nenhum {activeTab === 'flashcards' ? 'flashcard' : 'quiz'} criado ainda.
          </p>
          <p className="fq-empty__hint">
            Clique em <strong>Criar {activeTab === 'flashcards' ? 'Flashcard' : 'Quiz'}</strong> para gerar um a partir de um documento.
          </p>
        </div>
      ) : (
        (() => {
          const tipo        = activeTab === 'flashcards' ? 'flashcard' : 'quiz';
          const rotuloTipo  = activeTab === 'flashcards' ? 'Flashcards' : 'Quiz';
          const rotuloItens = activeTab === 'flashcards' ? 'cards' : 'questões';
          const rotuloLote  = (lote) => `${rotuloTipo} · ${lote.total_itens} ${rotuloItens}`;

          const renderLote = (lote, atrasado) => (
            <li
              key={lote.id}
              className={`fq-item${atrasado ? ' fq-item--due' : ''}`}
            >
              <div className="fq-item__icon">
                {activeTab === 'flashcards' ? Icon.flashcard : Icon.quiz}
              </div>
              <div className="fq-item__body">
                <p className="fq-item__title">{rotuloLote(lote)}</p>
                <p className="fq-item__meta">
                  {Icon.clock} Criado em {formatDate(lote.criado_em)}
                  {!atrasado && lote.proxima_revisao && (
                    <> · Próxima revisão em {formatDate(lote.proxima_revisao)}</>
                  )}
                </p>
              </div>
              <div className="fq-item__right">
                {atrasado && (
                  <span className="fq-item__due-badge">{lote.itens_vencidos} para revisar hoje</span>
                )}
                <button
                  className="fq-btn fq-btn--secondary fq-item__view-btn"
                  onClick={() => openStudy(lote, tipo, atrasado)}
                >
                  {Icon.play}
                  {atrasado ? 'Revisar agora' : 'Visualizar'}
                </button>
                <button
                  className="fq-item__delete-btn"
                  onClick={() => setDeleteTarget({ id: lote.id, tipo, titulo: rotuloLote(lote) })}
                  title="Excluir"
                >
                  {Icon.trash}
                </button>
              </div>
            </li>
          );

          const renderGrupos = (lotes, atrasado) => {
            const secao  = atrasado ? 'atrasados' : 'em-dia';
            const grupos = agruparPorDocumento(lotes);
            return grupos.map(grupo => {
              const key      = `${activeTab}:${secao}:${grupo.chave}`;
              // Atrasados começam abertos; em dia começa aberto só se houver poucos documentos
              const aberto   = abertos[key] ?? (atrasado || grupos.length <= 3);
              const contagem = atrasado
                ? `${grupo.lotes.reduce((soma, l) => soma + l.itens_vencidos, 0)} para revisar`
                : `${grupo.lotes.length} ${grupo.lotes.length === 1 ? 'lote' : 'lotes'}`;
              return (
                <li key={key} className="fq-group">
                  <button
                    type="button"
                    className="fq-group__header"
                    aria-expanded={aberto}
                    onClick={() => setAbertos(prev => ({ ...prev, [key]: !aberto }))}
                  >
                    <span className={`fq-group__chevron${aberto ? ' fq-group__chevron--open' : ''}`}>
                      {Icon.arrowRight}
                    </span>
                    <span className="fq-group__text">
                      <span className="fq-group__name">{grupo.nome}</span>
                      {grupo.pasta && (
                        <span className="fq-group__folder">{Icon.folder} {grupo.pasta}</span>
                      )}
                    </span>
                    <span className="fq-group__count">{contagem}</span>
                  </button>
                  {aberto && (
                    <ul className="fq-list fq-group__list">
                      {grupo.lotes.map(lote => renderLote(lote, atrasado))}
                    </ul>
                  )}
                </li>
              );
            });
          };

          return (
            <div className="fq-lists">
              <section className="fq-list-section">
                <h2 className="fq-list-section__title">
                  Atrasados <span className="fq-list-section__count">{atrasados.length}</span>
                </h2>
                {atrasados.length === 0 ? (
                  <p className="fq-list-section__empty">Nada atrasado por aqui — bom trabalho!</p>
                ) : (
                  <ul className="fq-list">{renderGrupos(atrasados, true)}</ul>
                )}
              </section>

              <section className="fq-list-section">
                <h2 className="fq-list-section__title">
                  Em dia <span className="fq-list-section__count">{emDia.length}</span>
                </h2>
                {emDia.length === 0 ? (
                  <p className="fq-list-section__empty">Nenhum item em dia no momento.</p>
                ) : (
                  <ul className="fq-list">{renderGrupos(emDia, false)}</ul>
                )}
              </section>
            </div>
          );
        })()
      )}

      {/* ══════════════════════════════════════════
          MODAL — Criação (seleção de documento)
      ══════════════════════════════════════════ */}
      {showModal && (
        <div className="fq-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="fq-modal" onClick={e => e.stopPropagation()}>
            <div className="fq-modal__header">
              <div className="fq-modal__header-icon">
                {showModal === 'flashcard' ? Icon.flashcard : Icon.quiz}
              </div>
              <div>
                <h2 className="fq-modal__title">
                  Criar {showModal === 'flashcard' ? 'Flashcard' : 'Quiz'}
                </h2>
                <p className="fq-modal__subtitle">
                  Selecione o documento que será usado como base.
                </p>
              </div>
              <button className="fq-modal__close" onClick={closeModal} disabled={isCreating} aria-label="Fechar">
                {Icon.close}
              </button>
            </div>

            <div className="fq-modal__search">
              <CampoBusca
                valor={termoBusca}
                onChange={setTermoBusca}
                placeholder="Buscar documento pelo nome…"
                ariaLabel="Buscar documento"
              />
            </div>

            <div className="fq-modal__body">
              {busca.carregando && busca.itens.length === 0 ? (
                <div className="fq-modal__loading">
                  {Icon.spinner}
                  {busca.termoAplicado ? 'Buscando...' : 'Carregando documentos...'}
                </div>
              ) : busca.erro ? (
                <p className="fq-modal__error">{busca.erro}</p>
              ) : busca.itens.length === 0 ? (
                <div className="fq-modal__empty">
                  {busca.termoAplicado ? (
                    <>Nenhum documento encontrado para <strong>“{busca.termoAplicado}”</strong>.</>
                  ) : (
                    <>Nenhum documento disponível. Faça upload de um arquivo em <strong>Gestão de Documentos</strong> primeiro.</>
                  )}
                </div>
              ) : (
                <>
                  <p className="fq-modal__count" aria-live="polite">
                    {busca.total} {busca.total === 1 ? 'documento' : 'documentos'}
                  </p>
                  <ul className={`fq-modal__list${busca.carregando ? ' fq-modal__list--stale' : ''}`}>
                    {busca.itens.map(doc => (
                      <li key={doc.id}>
                        <button
                          className={`fq-modal__doc${selectedDocId === doc.id ? ' fq-modal__doc--selected' : ''}`}
                          onClick={() => setSelectedDocId(doc.id)}
                        >
                          <span className="fq-modal__doc-icon">{Icon.file}</span>
                          <span className="fq-modal__doc-text">
                            <span className="fq-modal__doc-name">{doc.nome}</span>
                            {(doc.pasta_caminho || doc.pasta_nome) && <span className="fq-modal__doc-folder">{doc.pasta_caminho || doc.pasta_nome}</span>}
                          </span>
                          {selectedDocId === doc.id && (
                            <span className="fq-modal__doc-check">{Icon.check}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {busca.temMais && (
                    <button
                      type="button"
                      className="fq-modal__more"
                      onClick={busca.carregarMais}
                      disabled={busca.carregandoMais}
                    >
                      {busca.carregandoMais ? <>{Icon.spinner} Carregando...</> : 'Carregar mais'}
                    </button>
                  )}
                </>
              )}
              {modalError && <p className="fq-modal__error">{modalError}</p>}
            </div>

            <div className="fq-modal__difficulty">
              <span className="fq-modal__difficulty-label">Qual o nível de dificuldade?</span>
              <div className="fq-modal__difficulty-options">
                {[
                  { value: 'facil',   label: 'Fácil' },
                  { value: 'medio',   label: 'Médio' },
                  { value: 'dificil', label: 'Difícil' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`fq-difficulty-btn${selectedDificuldade === opt.value ? ' fq-difficulty-btn--selected' : ''}`}
                    onClick={() => setSelectedDificuldade(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fq-modal__difficulty">
              <span className="fq-modal__difficulty-label">
                Quantas perguntas você deseja para esse {showModal === 'flashcard' ? 'flashcard' : 'quiz'}?
              </span>
              <div className="fq-modal__difficulty-options">
                {QUANTIDADES.map(q => (
                  <button
                    key={q}
                    type="button"
                    className={`fq-difficulty-btn${selectedQuantidade === q ? ' fq-difficulty-btn--selected' : ''}`}
                    onClick={() => setSelectedQuantidade(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="fq-modal__footer">
              <button className="fq-btn fq-btn--ghost" onClick={closeModal} disabled={isCreating}>
                Cancelar
              </button>
              <button
                className={`fq-btn fq-btn--primary${isCreating ? ' fq-btn--loading' : ''}`}
                disabled={!selectedDocId || isCreating}
                onClick={handleCreate}
              >
                {isCreating ? <>{Icon.spinner} Gerando com IA...</> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Estudo
      ══════════════════════════════════════════ */}
      {studyItem && (
        <StudyModal
          item={studyItem}
          tipo={studyItem.tipo}
          somenteVencidos={studyItem.somenteVencidos}
          onClose={closeStudy}
        />
      )}


      {/* ══════════════════════════════════════════
          MODAL — Confirmar exclusão
      ══════════════════════════════════════════ */}
      {actionError && (
        <AlertModal
          title="Não foi possível excluir"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}

      {deleteTarget && (
        <div className="fq-overlay" onClick={() => !isDeleting && setDeleteTarget(null)} role="dialog" aria-modal="true">
          <div className="fq-modal" onClick={e => e.stopPropagation()}>
            <div className="fq-modal__header">
              <div className="fq-modal__header-icon">
                {deleteTarget.tipo === 'flashcard' ? Icon.flashcard : Icon.quiz}
              </div>
              <div>
                <h2 className="fq-modal__title">
                  Excluir {deleteTarget.tipo === 'flashcard' ? 'Flashcard' : 'Quiz'}
                </h2>
                <p className="fq-modal__subtitle">Esta ação não pode ser desfeita.</p>
              </div>
              <button className="fq-modal__close" onClick={() => setDeleteTarget(null)} disabled={isDeleting} aria-label="Fechar">
                {Icon.close}
              </button>
            </div>
            <div className="fq-modal__body">
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                Tem certeza que deseja excluir <strong>"{deleteTarget.titulo}"</strong>?
              </p>
            </div>
            <div className="fq-modal__footer">
              <button className="fq-btn fq-btn--ghost" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancelar
              </button>
              <button
                className={`fq-btn fq-btn--danger${isDeleting ? ' fq-btn--loading' : ''}`}
                onClick={deleteItem}
                disabled={isDeleting}
              >
                {isDeleting ? <>{Icon.spinner} Excluindo...</> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreating && <GeneratingOverlay tipo={showModal === 'flashcard' ? 'flashcard' : 'quiz'} />}
    </div>
  );
}
