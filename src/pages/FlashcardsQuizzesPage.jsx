import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './FlashcardsQuizzesPage.css';
import { API_BASE } from '../config';
import StudyModal from '../components/StudyModal';
import AIDisclaimerBanner from '../components/AIDisclaimerBanner';
import AlertModal from '../components/AlertModal';

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

function parseConteudo(c) {
  if (!c) return {};
  if (typeof c === 'string') {
    try { return JSON.parse(c); } catch { return {}; }
  }
  return c;
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
  const [dueIds,        setDueIds]        = useState(new Set());
  const [revCards,      setRevCards]      = useState([]);   // itens de revisão com conteúdo
  const [totals,        setTotals]        = useState({ flashcards: 0, quizzes: 0 });
  const [dbUserId,      setDbUserId]      = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState(null);
  const [searchParams] = useSearchParams();
  const [activeTab,     setActiveTab]     = useState(
    searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'flashcards'
  );

  // ── Modal de criação ──
  const [showModal,      setShowModal]      = useState(null); // 'flashcard' | 'quiz'
  const [modalDocs,      setModalDocs]      = useState([]);
  const [isLoadingDocs,  setIsLoadingDocs]  = useState(false);
  const [selectedDocId,  setSelectedDocId]  = useState(null);
  const [isCreating,     setIsCreating]     = useState(false);
  const [modalError,     setModalError]     = useState('');
  const [actionError,    setActionError]    = useState(null);
  const [selectedDificuldade, setSelectedDificuldade] = useState('medio');

  // ── Modal de estudo ──
  const [studyItem, setStudyItem] = useState(null); // { id, titulo, tipo }

  // ── Exclusão ──
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, tipo, titulo }
  const [isDeleting,   setIsDeleting]   = useState(false);

  /* ── Carrega listas + revisões ── */
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();
      const id = await getDbUserId(token);
      if (!id) throw new Error('Perfil não encontrado. Faça login novamente.');
      setDbUserId(id);

      const authHeader  = { Authorization: `Bearer ${token}` };
      const xUserHeader = { ...authHeader, 'X-User-Id': id };

      const [resDash, resRevFC, resRevQZ] = await Promise.all([
        fetch(`${API_BASE}/profile/${id}/dashboard`,  { headers: xUserHeader }),
        fetch(`${API_BASE}/revisoes/flashcards`,       { headers: xUserHeader }),
        fetch(`${API_BASE}/revisoes/quizzes`,          { headers: xUserHeader }),
      ]);

      if (!resDash.ok) throw new Error(`Erro ${resDash.status} ao carregar dados.`);
      const dash = await resDash.json();
      setFlashcards(dash.ultimos_flashcards || []);
      setQuizzes(dash.ultimos_quizzes       || []);
      setTotals({
        flashcards: dash.total_flashcards || 0,
        quizzes:    dash.total_quizzes    || 0,
      });

      const today = new Date();
      const due   = new Set();
      const allRevCards = [];

      if (resRevFC.ok) {
        const items = await resRevFC.json();
        items.forEach(r => {
          allRevCards.push({ ...r, tipo: 'flashcard', conteudo: parseConteudo(r.conteudo) });
          if (new Date(r.proxima_revisao) <= today) due.add(r.origem_id);
        });
      }
      if (resRevQZ.ok) {
        const items = await resRevQZ.json();
        items.forEach(r => {
          allRevCards.push({ ...r, tipo: 'quiz', conteudo: parseConteudo(r.conteudo) });
          if (new Date(r.proxima_revisao) <= today) due.add(r.origem_id);
        });
      }
      setDueIds(due);
      setRevCards(allRevCards);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Abre o modal e carrega os documentos do usuário ── */
  const openModal = async (type) => {
    setShowModal(type);
    setSelectedDocId(null);
    setModalError('');
    setModalDocs([]);
    setSelectedDificuldade('medio');
    setIsLoadingDocs(true);
    try {
      const { token } = await getAuthHeaders();
      const id = dbUserId || await getDbUserId(token);
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': id };

      const foldersRes = await fetch(`${API_BASE}/pastas/user/${id}/todas`, { headers });
      if (!foldersRes.ok) throw new Error('Erro ao carregar documentos.');
      const folders = await foldersRes.json();

      if (folders.length === 0) { setModalDocs([]); return; }

      const contentsArr = await Promise.all(
        folders.map(f =>
          fetch(`${API_BASE}/pastas/${f.id}/conteudo?limit=50&offset=0`, { headers })
            .then(r => r.ok ? r.json() : { arquivos: [] })
            .then(data => data.arquivos || [])
        )
      );

      setModalDocs(contentsArr.flat());
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsLoadingDocs(false);
    }
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
        body: JSON.stringify({ quantidade: 10, dificuldade: selectedDificuldade }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Erro ${res.status} ao gerar.`);
      }

      const created = await res.json();

      // Adiciona imediatamente na lista sem esperar load()
      const newItem = {
        id:         created.id,
        titulo:     created.titulo,
        criado_em:  created.criado_em,
      };

      if (showModal === 'flashcard') {
        setFlashcards(prev => [newItem, ...prev]);
        setTotals(prev => ({ ...prev, flashcards: prev.flashcards + 1 }));
        setActiveTab('flashcards');
      } else {
        setQuizzes(prev => [newItem, ...prev]);
        setTotals(prev => ({ ...prev, quizzes: prev.quizzes + 1 }));
        setActiveTab('quizzes');
      }

      setShowModal(null);
      // Recarrega em background para atualizar revisões
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  /* ── Abre/fecha o modal de estudo (StudyModal cuida do proprio carregamento) ── */
  const openStudy = (item, tipo) => setStudyItem({ ...item, tipo });
  const closeStudy = () => setStudyItem(null);

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
        setTotals(prev => ({ ...prev, flashcards: Math.max(0, prev.flashcards - 1) }));
      } else {
        setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id));
        setTotals(prev => ({ ...prev, quizzes: Math.max(0, prev.quizzes - 1) }));
      }
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Dados da tab ativa ── */
  const items    = activeTab === 'flashcards' ? flashcards : quizzes;
  const dueCount = items.filter(i => dueIds.has(i.id)).length;

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
          <span className="fq-tab__count">{totals.flashcards}</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'quizzes'}
          className={`fq-tab${activeTab === 'quizzes' ? ' fq-tab--active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          {Icon.quiz}
          Quizzes
          <span className="fq-tab__count">{totals.quizzes}</span>
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
          <button className="fq-error__retry" onClick={load}>Tentar novamente</button>
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
          const tipo = activeTab === 'flashcards' ? 'flashcard' : 'quiz';
          const atrasados = items.filter(item => dueIds.has(item.id));
          const emDia     = items.filter(item => !dueIds.has(item.id));

          const renderItem = (item, isDue) => (
            <li
              key={item.id}
              className={`fq-item${isDue ? ' fq-item--due' : ''}`}
            >
              <div className="fq-item__icon">
                {activeTab === 'flashcards' ? Icon.flashcard : Icon.quiz}
              </div>
              <div className="fq-item__body">
                <p className="fq-item__title">{item.titulo}</p>
                <p className="fq-item__meta">
                  {Icon.clock} Criado em {formatDate(item.criado_em)}
                </p>
              </div>
              <div className="fq-item__right">
                {isDue && <span className="fq-item__due-badge">Revisar hoje</span>}
                <button
                  className="fq-btn fq-btn--secondary fq-item__view-btn"
                  onClick={() => openStudy(item, tipo)}
                >
                  {Icon.play}
                  Visualizar {activeTab === 'flashcards' ? 'Flashcard' : 'Quiz'}
                </button>
                <button
                  className="fq-item__delete-btn"
                  onClick={() => setDeleteTarget({ id: item.id, tipo, titulo: item.titulo })}
                  title="Excluir"
                >
                  {Icon.trash}
                </button>
              </div>
            </li>
          );

          return (
            <div className="fq-lists">
              <section className="fq-list-section">
                <h2 className="fq-list-section__title">
                  Atrasados <span className="fq-list-section__count">{atrasados.length}</span>
                </h2>
                {atrasados.length === 0 ? (
                  <p className="fq-list-section__empty">Nada atrasado por aqui — bom trabalho!</p>
                ) : (
                  <ul className="fq-list fq-list--scroll">
                    {atrasados.map(item => renderItem(item, true))}
                  </ul>
                )}
              </section>

              <section className="fq-list-section">
                <h2 className="fq-list-section__title">
                  Em dia <span className="fq-list-section__count">{emDia.length}</span>
                </h2>
                {emDia.length === 0 ? (
                  <p className="fq-list-section__empty">Nenhum item em dia no momento.</p>
                ) : (
                  <ul className="fq-list fq-list--scroll">
                    {emDia.map(item => renderItem(item, false))}
                  </ul>
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

            <div className="fq-modal__body">
              {isLoadingDocs ? (
                <div className="fq-modal__loading">
                  {Icon.spinner}
                  Carregando documentos...
                </div>
              ) : modalDocs.length === 0 && !modalError ? (
                <div className="fq-modal__empty">
                  Nenhum documento disponível. Faça upload de um arquivo em <strong>Gestão de Documentos</strong> primeiro.
                </div>
              ) : (
                <ul className="fq-modal__list">
                  {modalDocs.map(doc => (
                    <li key={doc.id}>
                      <button
                        className={`fq-modal__doc${selectedDocId === doc.id ? ' fq-modal__doc--selected' : ''}`}
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <span className="fq-modal__doc-icon">{Icon.file}</span>
                        <span className="fq-modal__doc-name">{doc.nome}</span>
                        {selectedDocId === doc.id && (
                          <span className="fq-modal__doc-check">{Icon.check}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {modalError && <p className="fq-modal__error">{modalError}</p>}
            </div>

            <div className="fq-modal__difficulty">
              <span className="fq-modal__difficulty-label">Dificuldade</span>
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

            <div className="fq-modal__footer">
              <button className="fq-btn fq-btn--ghost" onClick={closeModal} disabled={isCreating}>
                Cancelar
              </button>
              <button
                className={`fq-btn fq-btn--primary${isCreating ? ' fq-btn--loading' : ''}`}
                disabled={!selectedDocId || isCreating || isLoadingDocs}
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
        <StudyModal item={studyItem} tipo={studyItem.tipo} onClose={closeStudy} />
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

    </div>
  );
}
