import { useState, useEffect, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './FlashcardsQuizzesPage.css';
import { API_BASE } from '../config';

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
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes,    setQuizzes]    = useState([]);
  const [dueIds,     setDueIds]     = useState(new Set());
  const [totals,     setTotals]     = useState({ flashcards: 0, quizzes: 0 });
  const [dbUserId,   setDbUserId]   = useState(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState('flashcards');

  // ── Modal de criação ──
  const [showModal,      setShowModal]      = useState(null); // 'flashcard' | 'quiz'
  const [modalDocs,      setModalDocs]      = useState([]);
  const [isLoadingDocs,  setIsLoadingDocs]  = useState(false);
  const [selectedDocId,  setSelectedDocId]  = useState(null);
  const [isCreating,     setIsCreating]     = useState(false);
  const [modalError,     setModalError]     = useState('');

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
        fetch(`${API_BASE}/profile/${id}/dashboard`,  { headers: authHeader }),
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
      if (resRevFC.ok) {
        const items = await resRevFC.json();
        items.forEach(r => { if (new Date(r.proxima_revisao) <= today) due.add(r.origem_id); });
      }
      if (resRevQZ.ok) {
        const items = await resRevQZ.json();
        items.forEach(r => { if (new Date(r.proxima_revisao) <= today) due.add(r.origem_id); });
      }
      setDueIds(due);
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
    setIsLoadingDocs(true);
    try {
      const { token } = await getAuthHeaders();
      const id = dbUserId || await getDbUserId(token);
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Busca todas as pastas do usuário
      const foldersRes = await fetch(`${API_BASE}/pastas/user/${id}/todas`, { headers });
      if (!foldersRes.ok) throw new Error('Erro ao carregar documentos.');
      const folders = await foldersRes.json();

      if (folders.length === 0) { setModalDocs([]); return; }

      // 2. Busca conteúdo de cada pasta em paralelo
      const contentsArr = await Promise.all(
        folders.map(f =>
          fetch(`${API_BASE}/pastas/${f.id}/conteudo?limit=50&offset=0`, { headers })
            .then(r => r.ok ? r.json() : { arquivos: [] })
            .then(data => data.arquivos || [])
        )
      );

      // 3. Junta todos os arquivos (qualquer status)
      setModalDocs(contentsArr.flat());
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  /* ── Confirma seleção e gera flashcard/quiz via Bedrock ── */
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
        body: JSON.stringify({ quantidade: 10 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Erro ${res.status} ao gerar ${showModal === 'flashcard' ? 'flashcard' : 'quiz'}.`);
      }

      setShowModal(null);
      await load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const closeModal = () => { if (!isCreating) setShowModal(null); };

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

      {/* ── Lista de itens ── */}
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
        <ul className="fq-list">
          {items.map(item => (
            <li key={item.id} className={`fq-item${dueIds.has(item.id) ? ' fq-item--due' : ''}`}>
              <div className="fq-item__icon">
                {activeTab === 'flashcards' ? Icon.flashcard : Icon.quiz}
              </div>
              <div className="fq-item__body">
                <p className="fq-item__title">{item.titulo}</p>
                <p className="fq-item__meta">
                  {Icon.clock} Criado em {formatDate(item.criado_em)}
                </p>
              </div>
              {dueIds.has(item.id) && (
                <span className="fq-item__due-badge">Revisar hoje</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Seleção de documento
      ══════════════════════════════════════════ */}
      {showModal && (
        <div className="fq-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="fq-modal" onClick={e => e.stopPropagation()}>

            {/* Cabeçalho do modal */}
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

            {/* Lista de documentos */}
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

              {modalError && (
                <p className="fq-modal__error">{modalError}</p>
              )}
            </div>

            {/* Rodapé do modal */}
            <div className="fq-modal__footer">
              <button className="fq-btn fq-btn--ghost" onClick={closeModal} disabled={isCreating}>
                Cancelar
              </button>
              <button
                className={`fq-btn fq-btn--primary${isCreating ? ' fq-btn--loading' : ''}`}
                disabled={!selectedDocId || isCreating || isLoadingDocs}
                onClick={handleCreate}
              >
                {isCreating ? (
                  <>{Icon.spinner} Gerando com IA...</>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
