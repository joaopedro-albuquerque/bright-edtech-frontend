import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './DocumentsPage.css';

/* ─────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────── */
const API_BASE = 'http://ALB-bright-edtech-backend-1682576082.us-east-1.elb.amazonaws.com';

/* ─────────────────────────────────────────────
   ÍCONES SVG INLINE
───────────────────────────────────────────── */
const Icon = {
  folder: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4.086a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 10.828 6H16.5A1.5 1.5 0 0 1 18 7.5v7A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5v-9Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  file: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M10 1H4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 4 17h10a1.5 1.5 0 0 0 1.5-1.5V6.5L10 1Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 1v5.5h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 12V4M5 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  back: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="3.5" r="1.2" fill="currentColor"/>
      <circle cx="8" cy="8"   r="1.2" fill="currentColor"/>
      <circle cx="8" cy="12.5" r="1.2" fill="currentColor"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5h6.5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  spinner: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="dp-spin">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
      <path d="M9 2a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HOOK: pega token + userId do Cognito
───────────────────────────────────────────── */
async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token   = session.tokens.idToken.toString();
  const userId  = session.tokens.idToken.payload.sub; // 'sub' = Cognito user_id
  return { token, userId };
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function DocumentsPage() {
  // ── Estados principais ──
  const [userId,          setUserId]          = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);   // null = raiz
  const [breadcrumb,      setBreadcrumb]      = useState([]);      // rastro de navegação
  const [folders,         setFolders]         = useState([]);
  const [files,           setFiles]           = useState([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState(null);

  // ── Estados de modal/UI ──
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName,      setNewFolderName]      = useState('');
  const [isSaving,           setIsSaving]           = useState(false);

  const [renameTarget, setRenameTarget] = useState(null);   // { id, nome }
  const [renameName,   setRenameName]   = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);   // { id, nome }

  const [uploadFolderId, setUploadFolderId] = useState(null);
  const [uploadFile,     setUploadFile]     = useState(null);
  const [uploadName,     setUploadName]     = useState('');
  const [isUploading,    setIsUploading]    = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null); // id da pasta com menu aberto
  const menuRef = useRef(null);

  /* ── Fecha o menu ao clicar fora ── */
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ─────────────────────────────────────────
     1. LISTAR PASTAS RAIZ
  ───────────────────────────────────────── */
  const loadRootFolders = useCallback(async (uid) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, userId: resolvedId } = await getAuthHeaders();
      const id = uid ?? resolvedId;
      setUserId(id);

      const res = await fetch(
        `${API_BASE}/pastas/user/${id}?limit=50&offset=0`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível carregar as pastas.`);
      const data = await res.json();
      setFolders(Array.isArray(data) ? data : (data.pastas ?? []));
      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Carrega na montagem */
  useEffect(() => { loadRootFolders(); }, [loadRootFolders]);

  /* ─────────────────────────────────────────
     3. ENTRAR EM UMA PASTA
  ───────────────────────────────────────── */
  const openFolder = async (folder) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();
      const res = await fetch(
        `${API_BASE}/pastas/${folder.id}/conteudo?limit=50&offset=0`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível abrir a pasta.`);
      const data = await res.json();
      setCurrentFolderId(folder.id);
      setBreadcrumb((prev) => [...prev, { id: folder.id, nome: folder.nome }]);
      setFolders(data.subpastas ?? []);
      setFiles(data.arquivos   ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Voltar na navegação (breadcrumb) ── */
  const navigateTo = async (targetId, targetIndex) => {
    if (targetId === null) {
      // Volta à raiz
      setBreadcrumb([]);
      setCurrentFolderId(null);
      loadRootFolders(userId);
      return;
    }
    const crumb = breadcrumb[targetIndex];
    setBreadcrumb((prev) => prev.slice(0, targetIndex + 1));
    await openFolder({ id: crumb.id, nome: crumb.nome });
    setBreadcrumb((prev) => prev.slice(0, targetIndex + 1));
  };

  /* ─────────────────────────────────────────
     2. CRIAR NOVA PASTA
  ───────────────────────────────────────── */
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsSaving(true);
    try {
      const { token, userId: uid } = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/pastas`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:      newFolderName.trim(),
          usuario_id:   userId ?? uid,
          parent_id: currentFolderId,
        }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível criar a pasta.`);
      const nova = await res.json();
      setFolders((prev) => [nova, ...prev]);
      setShowNewFolderModal(false);
      setNewFolderName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────────────────────
     5a. RENOMEAR PASTA
  ───────────────────────────────────────── */
  const renameFolder = async () => {
    if (!renameName.trim() || !renameTarget) return;
    setIsSaving(true);
    try {
      const { token } = await getAuthHeaders();
      // application/x-www-form-urlencoded conforme especificado
      const body = new URLSearchParams({ nome: renameName.trim() });
      const res = await fetch(`${API_BASE}/pastas/${renameTarget.id}`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível renomear.`);
      setFolders((prev) =>
        prev.map((f) => f.id === renameTarget.id ? { ...f, nome: renameName.trim() } : f)
      );
      setRenameTarget(null);
      setRenameName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────────────────────
     5b. DELETAR PASTA
  ───────────────────────────────────────── */
  const deleteFolder = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const { token } = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/pastas/${deleteTarget.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível deletar a pasta.`);
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────────────────────
     4. UPLOAD DE DOCUMENTO
  ───────────────────────────────────────── */
  const uploadDocument = async () => {
    if (!uploadFile || !uploadFolderId) return;
    setIsUploading(true);
    try {
      const { token, userId: uid } = await getAuthHeaders();
      const formData = new FormData();
      formData.append('documento',       uploadFile);
      formData.append('pasta_id',        uploadFolderId);
      formData.append('user_id',         userId ?? uid);
      formData.append('nome_documento',  uploadName.trim() || uploadFile.name);

      // ⚠️ SEM Content-Type — o browser define com o boundary automaticamente
      const res = await fetch(`${API_BASE}/documentos/upload`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: falha no upload.`);
      const novoArquivo = await res.json();
      setFiles((prev) => [novoArquivo, ...prev]);
      setUploadFolderId(null);
      setUploadFile(null);
      setUploadName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  /* ─────────────────────────────────────────
     HELPERS DE UI
  ───────────────────────────────────────── */
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch { return iso; }
  };

  const isEmpty = !isLoading && folders.length === 0 && files.length === 0;

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="dp-root">

      {/* ── Cabeçalho da página ── */}
      <header className="dp-header">
        <div className="dp-header__text">
          <h1 className="dp-header__title">Criação e Gestão de Documentos</h1>
          <p className="dp-header__subtitle">
            Aqui você visualiza a organização dos seus documentos, a partir de pastas e subpastas, como você preferir!
          </p>
        </div>

        <div className="dp-header__actions">
          {currentFolderId && (
            <button
              className="dp-btn dp-btn--upload"
              onClick={() => setUploadFolderId(currentFolderId)}
            >
              {Icon.upload}
              Enviar arquivo
            </button>
          )}
          <button
            className="dp-btn dp-btn--primary"
            onClick={() => setShowNewFolderModal(true)}
          >
            {Icon.plus}
            Nova pasta
          </button>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      {(breadcrumb.length > 0) && (
        <nav className="dp-breadcrumb" aria-label="Localização">
          <button className="dp-breadcrumb__item dp-breadcrumb__item--link"
            onClick={() => navigateTo(null, -1)}>
            Início
          </button>
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="dp-breadcrumb__segment">
              {Icon.chevronRight}
              {i < breadcrumb.length - 1 ? (
                <button
                  className="dp-breadcrumb__item dp-breadcrumb__item--link"
                  onClick={() => navigateTo(crumb.id, i)}
                >
                  {crumb.nome}
                </button>
              ) : (
                <span className="dp-breadcrumb__item dp-breadcrumb__item--active">
                  {crumb.nome}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* ── Feedback de erro ── */}
      {error && (
        <div className="dp-error" role="alert">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} aria-label="Fechar erro">✕</button>
        </div>
      )}

      {/* ── Estado de carregamento ── */}
      {isLoading && (
        <div className="dp-loading">
          {Icon.spinner}
          <span>Carregando...</span>
        </div>
      )}

      {/* ── Estado vazio ── */}
      {isEmpty && (
        <div className="dp-empty">
          <div className="dp-empty__icon">{Icon.folder}</div>
          <p className="dp-empty__title">Nenhuma pasta por aqui</p>
          <p className="dp-empty__sub">Crie sua primeira pasta para organizar seus documentos.</p>
          <button className="dp-btn dp-btn--primary" onClick={() => setShowNewFolderModal(true)}>
            {Icon.plus} Criar pasta
          </button>
        </div>
      )}

      {/* ── Grade de pastas ── */}
      {!isLoading && folders.length > 0 && (
        <section className="dp-section">
          {breadcrumb.length > 0 && <h2 className="dp-section__label">Pastas</h2>}
          <div className="dp-grid">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`dp-card dp-card--folder${openMenuId === folder.id ? ' dp-card--menu-open' : ''}`}
              >
                {/* Área clicável para entrar na pasta */}
                <button
                  className="dp-card__body"
                  onClick={() => openFolder(folder)}
                  aria-label={`Abrir pasta ${folder.nome}`}
                >
                  <div className="dp-card__icon">{Icon.folder}</div>
                  <div className="dp-card__info">
                    <span className="dp-card__name">{folder.nome}</span>
                    <span className="dp-card__meta">
                      {folder.total_arquivos != null
                        ? `${folder.total_arquivos} arquivo${folder.total_arquivos !== 1 ? 's' : ''}`
                        : '—'}
                    </span>
                  </div>
                  {folder.criado_em && (
                    <span className="dp-card__date">Criado em {formatDate(folder.criado_em)}</span>
                  )}
                </button>

                {/* Menu de ações (⋮) */}
                <div className="dp-card__menu-wrap" ref={openMenuId === folder.id ? menuRef : null}>
                  <button
                    className="dp-card__menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => prev === folder.id ? null : folder.id);
                    }}
                    aria-label="Opções da pasta"
                    aria-expanded={openMenuId === folder.id}
                  >
                    {Icon.more}
                  </button>

                  {openMenuId === folder.id && (
                    <div className="dp-dropdown" role="menu">
                      <button
                        className="dp-dropdown__item"
                        role="menuitem"
                        onClick={() => {
                          setRenameTarget({ id: folder.id, nome: folder.nome });
                          setRenameName(folder.nome);
                          setOpenMenuId(null);
                        }}
                      >
                        {Icon.edit} Renomear
                      </button>
                      <button
                        className="dp-dropdown__item dp-dropdown__item--danger"
                        role="menuitem"
                        onClick={() => {
                          setDeleteTarget({ id: folder.id, nome: folder.nome });
                          setOpenMenuId(null);
                        }}
                      >
                        {Icon.trash} Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Grade de arquivos (dentro de uma pasta) ── */}
      {!isLoading && files.length > 0 && (
        <section className="dp-section">
          <h2 className="dp-section__label">Arquivos</h2>
          <div className="dp-grid">
            {files.map((file) => (
              <div key={file.id} className="dp-card dp-card--file">
                <div className="dp-card__body dp-card__body--file">
                  <div className="dp-card__icon dp-card__icon--file">{Icon.file}</div>
                  <div className="dp-card__info">
                    <span className="dp-card__name">{file.nome_documento ?? file.nome}</span>
                    <span className="dp-card__meta">{file.tipo ?? 'Documento'}</span>
                  </div>
                  {file.criado_em && (
                    <span className="dp-card__date">Enviado em {formatDate(file.criado_em)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          MODAIS
      ══════════════════════════════════════════ */}

      {/* Modal: Nova pasta */}
      {showNewFolderModal && (
        <Modal
          title="Nova pasta"
          onClose={() => { setShowNewFolderModal(false); setNewFolderName(''); }}
          onConfirm={createFolder}
          confirmLabel="Criar"
          isLoading={isSaving}
          confirmDisabled={!newFolderName.trim()}
        >
          <div className="dp-modal__field">
            <label className="dp-modal__label" htmlFor="folder-name">Nome da pasta</label>
            <input
              id="folder-name"
              className="dp-modal__input"
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: Matemática"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
          </div>
        </Modal>
      )}

      {/* Modal: Renomear pasta */}
      {renameTarget && (
        <Modal
          title="Renomear pasta"
          onClose={() => { setRenameTarget(null); setRenameName(''); }}
          onConfirm={renameFolder}
          confirmLabel="Salvar"
          isLoading={isSaving}
          confirmDisabled={!renameName.trim()}
        >
          <div className="dp-modal__field">
            <label className="dp-modal__label" htmlFor="rename-input">Novo nome</label>
            <input
              id="rename-input"
              className="dp-modal__input"
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && renameFolder()}
            />
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar exclusão */}
      {deleteTarget && (
        <Modal
          title="Excluir pasta"
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteFolder}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={isSaving}
        >
          <p className="dp-modal__text">
            Tem certeza que deseja excluir a pasta{' '}
            <strong>"{deleteTarget.nome}"</strong>?{' '}
            Esta ação não pode ser desfeita e todo o conteúdo será removido.
          </p>
        </Modal>
      )}

      {/* Modal: Upload de arquivo */}
      {uploadFolderId && (
        <Modal
          title="Enviar arquivo"
          onClose={() => { setUploadFolderId(null); setUploadFile(null); setUploadName(''); }}
          onConfirm={uploadDocument}
          confirmLabel="Enviar"
          isLoading={isUploading}
          confirmDisabled={!uploadFile}
        >
          <div className="dp-modal__field">
            <label className="dp-modal__label" htmlFor="upload-file">Arquivo</label>
            <label className="dp-upload-area" htmlFor="upload-file">
              {uploadFile ? (
                <span className="dp-upload-area__name">{uploadFile.name}</span>
              ) : (
                <>
                  {Icon.upload}
                  <span>Clique ou arraste um arquivo aqui</span>
                </>
              )}
              <input
                id="upload-file"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) { setUploadFile(f); if (!uploadName) setUploadName(f.name); }
                }}
              />
            </label>
          </div>
          <div className="dp-modal__field">
            <label className="dp-modal__label" htmlFor="upload-name">
              Nome do documento <span className="dp-modal__optional">(opcional)</span>
            </label>
            <input
              id="upload-name"
              className="dp-modal__input"
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Deixe em branco para usar o nome do arquivo"
            />
          </div>
        </Modal>
      )}

      {/* ── FAB: botão flutuante de nova pasta (mobile) ── */}
      <button
        className="dp-fab"
        onClick={() => setShowNewFolderModal(true)}
        aria-label="Nova pasta"
        title="Nova pasta"
      >
        {Icon.plus}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE AUXILIAR: Modal genérico reutilizável
───────────────────────────────────────────── */
function Modal({ title, onClose, onConfirm, confirmLabel, confirmVariant = 'primary',
                 isLoading, confirmDisabled = false, children }) {
  // Fecha com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="dp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dp-modal">
        <div className="dp-modal__header">
          <h2 className="dp-modal__title" id="modal-title">{title}</h2>
          <button className="dp-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="dp-modal__body">{children}</div>
        <div className="dp-modal__footer">
          <button className="dp-btn dp-btn--ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className={`dp-btn dp-btn--${confirmVariant}${isLoading ? ' dp-btn--loading' : ''}`}
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
          >
            {isLoading ? (
              <><span className="dp-btn-spinner" aria-hidden="true" />{confirmLabel}…</>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}