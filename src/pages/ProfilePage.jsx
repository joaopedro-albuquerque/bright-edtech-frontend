import { useState, useEffect, useCallback } from 'react';
import { fetchAuthSession, deleteUser } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { API_BASE } from '../config';

/* ─────────────────────────────────────────────
   ÍCONES SVG INLINE
───────────────────────────────────────────── */
const Icon = {
  user: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="9"  r="5"  stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 25c0-5.523 4.477-10 10-10s10 4.477 10 10"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  edit: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M10.5 2.5l2 2L5 12H3v-2l7.5-7.5Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  save: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2.5 8l3.5 3.5 6.5-7"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  lock: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  warn: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.5L1.5 15h15L9 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 7v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="12.5" r="0.8" fill="currentColor"/>
    </svg>
  ),
  spinner: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pf-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HELPER: token + userId
───────────────────────────────────────────── */
async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token   = session.tokens.idToken.toString();
  const userId  = session.tokens.idToken.payload.sub;
  const email   = session.tokens.idToken.payload.email ?? '';
  return { token, userId, email };
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();

  /* ── Estados de dados ── */
  // dbUserId = UUID interno do banco (não o Cognito sub)
  const [dbUserId,  setDbUserId]  = useState('');
  const [email,     setEmail]     = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');

  /* ── Estados de UI ── */
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  /* ── Modal de confirmação de exclusão ── */
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  /* ─────────────────────────────────────────
     GET /profile — identidade via JWT (igual Sidebar)
  ───────────────────────────────────────── */
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, email: em } = await getAuthHeaders();

      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível carregar o perfil.`);

      const data = await res.json();

      setDbUserId(data.id ?? '');
      setEmail(data.email ?? em ?? '');

      /* O back-end envia "nome" como string completa.
         Quebramos no primeiro espaço para separar nome e sobrenome. */
      const nomeCompleto = data.nome ?? '';
      const spaceIndex   = nomeCompleto.indexOf(' ');
      if (spaceIndex === -1) {
        setFirstName(nomeCompleto);
        setLastName('');
      } else {
        setFirstName(nomeCompleto.slice(0, spaceIndex));
        setLastName(nomeCompleto.slice(spaceIndex + 1));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  /* ─────────────────────────────────────────
     PUT /profile — salvar alterações (JWT)
  ───────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { token } = await getAuthHeaders();
      // Junta nome + sobrenome de volta em um único campo
      const nomeCompleto = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

      // UsuarioBase exige email; demais campos opcionais
      const res = await fetch(`${API_BASE}/profile`, {
        method:  'PUT',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, nome: nomeCompleto }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível salvar as alterações.`);

      setSuccess('Perfil atualizado com sucesso!');
      // Limpa o feedback após 4 s
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────────────────────
     DELETE — excluir conta
     Fluxo obrigatório:
       1. DELETE na API (UUID DB + X-User-Id)
       2. deleteUser() do Amplify
       3. navigate('/')
  ───────────────────────────────────────── */
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();

      if (!dbUserId) {
        throw new Error('Não foi possível identificar o usuário para exclusão.');
      }

      // 1. Remove do back-end (rota /{user_id} exige X-User-Id = UUID do banco)
      const res = await fetch(`${API_BASE}/profile/${dbUserId}`, {
        method:  'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': dbUserId,
        },
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: falha ao excluir conta no servidor.`);

      // 2. Remove do Cognito
      await deleteUser();

      // 3. Redireciona para a Landing Page
      navigate('/');
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  /* ─────────────────────────────────────────
     RENDER — LOADING
  ───────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="pf-root">
        <div className="pf-skeleton pf-skeleton--header" />
        <div className="pf-skeleton pf-skeleton--card" />
        <div className="pf-skeleton pf-skeleton--card pf-skeleton--card-sm" />
      </div>
    );
  }

  const deleteConfirmMatch = deleteConfirmText.trim().toLowerCase() === 'excluir minha conta';

  /* ═══════════════════════════════════════════
     RENDER — CONTEÚDO
  ═══════════════════════════════════════════ */
  return (
    <div className="pf-root">

      {/* ── Cabeçalho ── */}
      <header className="pf-header">
        <div className="pf-header__avatar">
          {Icon.user}
        </div>
        <div>
          <h1 className="pf-header__name">
            {[firstName, lastName].filter(Boolean).join(' ') || 'Meu Perfil'}
          </h1>
          <p className="pf-header__email">{email}</p>
        </div>
      </header>

      {/* ── Feedback global ── */}
      {error && (
        <div className="pf-alert pf-alert--error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fechar">✕</button>
        </div>
      )}
      {success && (
        <div className="pf-alert pf-alert--success" role="status">
          {Icon.save} {success}
        </div>
      )}

      {/* ── Card: Informações pessoais ── */}
      <section className="pf-card" aria-labelledby="pf-info-title">
        <div className="pf-card__header">
          <h2 className="pf-card__title" id="pf-info-title">Informações pessoais</h2>
          <p className="pf-card__sub">Atualize seu nome de exibição na plataforma.</p>
        </div>

        <form onSubmit={handleSave} className="pf-form" noValidate>
          {/* Nome e Sobrenome */}
          <div className="pf-form__row">
            <div className="pf-field">
              <label className="pf-field__label" htmlFor="pf-firstname">Nome</label>
              <input
                id="pf-firstname"
                className="pf-field__input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Maria"
                autoComplete="given-name"
                required
              />
            </div>
            <div className="pf-field">
              <label className="pf-field__label" htmlFor="pf-lastname">Sobrenome</label>
              <input
                id="pf-lastname"
                className="pf-field__input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Silva"
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* E-mail (somente leitura) */}
          <div className="pf-field">
            <label className="pf-field__label" htmlFor="pf-email">
              E-mail
              <span className="pf-field__badge">
                {Icon.lock} Somente leitura
              </span>
            </label>
            <input
              id="pf-email"
              className="pf-field__input pf-field__input--readonly"
              type="email"
              value={email}
              readOnly
              tabIndex={-1}
            />
          </div>

          <div className="pf-form__footer">
            <button
              type="submit"
              className={`pf-btn pf-btn--primary${isSaving ? ' pf-btn--loading' : ''}`}
              disabled={isSaving || !firstName.trim()}
            >
              {isSaving
                ? <>{Icon.spinner} Salvando…</>
                : <>{Icon.save} Salvar alterações</>}
            </button>
          </div>
        </form>
      </section>

      {/* ── Card: Área de risco ── */}
      <section className="pf-card pf-card--danger" aria-labelledby="pf-danger-title">
        <div className="pf-card__header">
          <div className="pf-danger-header">
            <span className="pf-danger-icon">{Icon.warn}</span>
            <div>
              <h2 className="pf-card__title pf-card__title--danger" id="pf-danger-title">
                Área de risco
              </h2>
              <p className="pf-card__sub">
                Ações irreversíveis que afetam permanentemente a sua conta.
              </p>
            </div>
          </div>
        </div>

        <div className="pf-danger-body">
          <div className="pf-danger-item">
            <div>
              <p className="pf-danger-item__title">Excluir minha conta</p>
              <p className="pf-danger-item__desc">
                Remove todos os seus dados, documentos, flashcards e questionários. Esta ação não pode ser desfeita.
              </p>
            </div>
            <button
              className="pf-btn pf-btn--danger"
              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
            >
              Excluir conta
            </button>
          </div>
        </div>
      </section>

      {/* ── Modal de confirmação de exclusão ── */}
      {showDeleteModal && (
        <div
          className="pf-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pf-delete-title"
          onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setShowDeleteModal(false); }}
        >
          <div className="pf-modal">
            <div className="pf-modal__header">
              <span className="pf-modal__warn-icon">{Icon.warn}</span>
              <h2 className="pf-modal__title" id="pf-delete-title">
                Excluir conta permanentemente?
              </h2>
            </div>

            <div className="pf-modal__body">
              <p className="pf-modal__text">
                Esta ação é <strong>irreversível</strong>. Todos os seus dados serão removidos
                do servidor e do Cognito. Você perderá acesso imediatamente.
              </p>

              <div className="pf-field">
                <label className="pf-field__label" htmlFor="pf-delete-confirm">
                  Para confirmar, digite <strong>excluir minha conta</strong> abaixo:
                </label>
                <input
                  id="pf-delete-confirm"
                  className={`pf-field__input${deleteConfirmMatch ? ' pf-field__input--match' : ''}`}
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="excluir minha conta"
                  autoFocus
                  disabled={isDeleting}
                />
              </div>
            </div>

            <div className="pf-modal__footer">
              <button
                className="pf-btn pf-btn--ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className={`pf-btn pf-btn--danger${isDeleting ? ' pf-btn--loading' : ''}`}
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmMatch || isDeleting}
              >
                {isDeleting
                  ? <>{Icon.spinner} Excluindo…</>
                  : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}