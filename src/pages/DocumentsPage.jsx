import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DocumentsPage.css';
import { API_BASE } from '../config';
import StudyModal from '../components/StudyModal';
import Modal from '../components/Modal';
import { RESUMO_FORMATOS } from '../constants/resumoFormatos';

/* ─────────────────────────────────────────────
   ÍCONES SVG INLINE
───────────────────────────────────────────── */
const Icon = {
  folder: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4.086a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 10.828 6H16.5A1.5 1.5 0 0 1 18 7.5v7A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5v-9Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  file: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M10 1H4a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 4 17h10a1.5 1.5 0 0 0 1.5-1.5V6.5L10 1Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 1v5.5h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 12V4M5 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 9s2.8-5.5 8-5.5S17 9 17 9s-2.8 5.5-8 5.5S1 9 1 9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  download: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 4v8M5 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  back: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5h6.5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronRight: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  spinner: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="dp-spin">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M9 2a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ai: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2 L11.8 7.2 L17 9 L11.8 10.8 L10 16 L8.2 10.8 L3 9 L8.2 7.2 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M16 1 L16.9 3.1 L19 4 L16.9 4.9 L16 7 L15.1 4.9 L13 4 L15.1 3.1 Z"
        fill="currentColor"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HOOK: pega token + userId do Cognito
───────────────────────────────────────────── */
async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens.idToken.toString();
  const userId = session.tokens.idToken.payload.sub; // 'sub' = Cognito user_id
  return { token, userId };
}

/* ─────────────────────────────────────────────
   HELPER: Busca o ID do banco do endpoint /profile
───────────────────────────────────────────── */
async function getBankUserId(token) {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn(`Profile request failed: ${res.status}`);
      return null;
    }
    const profile = await res.json();
    console.log('Profile carregado:', profile);
    return profile.id;  // ID do banco
  } catch (err) {
    console.error('Erro ao carregar profile:', err.message);
    return null;
  }
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function DocumentsPage() {
  // ── Estados principais ──
  const [userId, setUserId] = useState(null);  // ID do Cognito
  const [dbUserId, setDbUserId] = useState(null);  // ID do banco
  const [currentFolderId, setCurrentFolderId] = useState(null);   // null = raiz
  const [breadcrumb, setBreadcrumb] = useState([]);      // rastro de navegação
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Estados de modal/UI ──
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [renameTarget, setRenameTarget] = useState(null);   // { id, nome }
  const [renameName, setRenameName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);   // { id, nome }

  const [uploadFolderId, setUploadFolderId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFileId, setGeneratingFileId] = useState(null);  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryFileName, setSummaryFileName] = useState('');
  const [summaryResumoId, setSummaryResumoId] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [newSummaryTarget, setNewSummaryTarget] = useState(null); // file
  const [newSummaryFormat, setNewSummaryFormat] = useState('cornell');
  const [summaryReturnTo,  setSummaryReturnTo]  = useState(null); // file a reabrir na lista ao fechar a visualização
  const [openMenuId, setOpenMenuId] = useState(null); // id da pasta com menu aberto
  const menuRef = useRef(null);

  // ── Estados para documentos (lista + contagens) ──
  const [fileCounts,       setFileCounts]       = useState({}); // { [fileId]: { resumos, flashcards, quizzes } }
  const [renameFileTarget, setRenameFileTarget] = useState(null); // { id, nome }
  const [renameFileName,   setRenameFileName]   = useState('');
  const [deleteFileTarget, setDeleteFileTarget] = useState(null); // { id, nome }

  // ── Modal de listagem por tipo (resumos/flashcards/quizzes de um documento) ──
  const [contentModal,        setContentModal]        = useState(null); // { file, tipo }
  const [contentModalItems,   setContentModalItems]   = useState([]);
  const [isLoadingContent,    setIsLoadingContent]    = useState(false);
  const [contentModalError,   setContentModalError]   = useState('');
  const [renameContentTarget, setRenameContentTarget] = useState(null); // { tipo, id, titulo }
  const [renameContentTitle,  setRenameContentTitle]  = useState('');
  const [deleteContentTarget, setDeleteContentTarget] = useState(null); // { tipo, id, titulo }
  const [isSavingContent,     setIsSavingContent]     = useState(false);
  const [isQuickGenerating,   setIsQuickGenerating]   = useState(false);
  const [studyItem,           setStudyItem]           = useState(null); // { id, titulo, tipo }

  const CONTENT_LABELS = {
    resumos:    { singular: 'Resumo',    plural: 'Resumos' },
    flashcards: { singular: 'Flashcard', plural: 'Flashcards' },
    quizzes:    { singular: 'Quiz',      plural: 'Quizzes' },
  };

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
  const loadRootFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = await getBankUserId(token);

      if (!bankUserId) throw new Error('Não foi possível obter o ID do usuário.');
      setDbUserId(bankUserId);

      const res = await fetch(
        `${API_BASE}/pastas/user/${bankUserId}?limit=50&offset=0`,
        { headers: { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId } }
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
  const loadFolderContent = async (folder) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await getAuthHeaders();
      const res = await fetch(
        `${API_BASE}/pastas/${folder.id}/conteudo?limit=50&offset=0`,
        { headers: { Authorization: `Bearer ${token}`, 'X-User-Id': dbUserId } }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível abrir a pasta.`);
      const data = await res.json();
      setCurrentFolderId(folder.id);
      setFolders(data.subpastas ?? []);
      const filesData = data.arquivos ?? [];
      setFiles(filesData);
      setFileCounts({});
      if (filesData.length > 0 && dbUserId) {
        loadFileCounts(filesData, token, dbUserId);
      }
      window.dispatchEvent(new CustomEvent('brightedtech:docs-tour-unlock'));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const openFolder = async (folder) => {
    const ok = await loadFolderContent(folder);
    // Só atualiza o breadcrumb depois do sucesso — evita trilha desalinhada
    if (ok) {
      setBreadcrumb((prev) => [...prev, { id: folder.id, nome: folder.nome }]);
    }
  };

  /* ── Voltar na navegação (breadcrumb) ── */
  const navigateTo = async (targetId, targetIndex) => {
    if (targetId === null) {
      // Volta à raiz
      setBreadcrumb([]);
      setCurrentFolderId(null);
      loadRootFolders();
      return;
    }
    const crumb = breadcrumb[targetIndex];
    if (!crumb) return;
    const trail = breadcrumb.slice(0, targetIndex + 1);
    const ok = await loadFolderContent({ id: crumb.id, nome: crumb.nome });
    if (ok) {
      setBreadcrumb(trail);
    }
  };

  /* ─────────────────────────────────────────
     2. CRIAR NOVA PASTA
  ───────────────────────────────────────── */
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsSaving(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = await getBankUserId(token);

      if (!bankUserId) throw new Error('Não foi possível obter o ID do usuário.');

      const res = await fetch(`${API_BASE}/pastas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': bankUserId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: newFolderName.trim(),
          pasta_pai_id: currentFolderId,
        }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível criar a pasta.`);
      const nova = await res.json();
      setFolders((prev) => [nova, ...prev]);
      setShowNewFolderModal(false);
      setNewFolderName('');
      window.dispatchEvent(new CustomEvent('brightedtech:docs-tour-unlock'));
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
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': dbUserId,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
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
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': dbUserId },
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
     CARREGAR CONTAGENS POR DOCUMENTO
  ───────────────────────────────────────── */
  const loadFileCounts = useCallback(async (files, token, userId) => {
    if (!files.length || !userId) return;
    const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': userId };
    const results = await Promise.all(
      files.map(async (file) => {
        const [rRes, fRes, qRes] = await Promise.all([
          fetch(`${API_BASE}/documentos/${file.id}/resumos`,   { headers }),
          fetch(`${API_BASE}/documentos/${file.id}/flashcards`, { headers }),
          fetch(`${API_BASE}/documentos/${file.id}/quizzes`,    { headers }),
        ]);
        const [resumos, flashcards, quizzes] = await Promise.all([
          rRes.ok ? rRes.json() : [],
          fRes.ok ? fRes.json() : [],
          qRes.ok ? qRes.json() : [],
        ]);
        return { id: file.id, resumos: resumos.length, flashcards: flashcards.length, quizzes: quizzes.length };
      })
    );
    const counts = {};
    results.forEach(r => { counts[r.id] = r; });
    setFileCounts(counts);
  }, []);

  /* ─────────────────────────────────────────
     RENOMEAR DOCUMENTO
  ───────────────────────────────────────── */
  const renameDocument = async () => {
    if (!renameFileName.trim() || !renameFileTarget) return;
    setIsSaving(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const formData = new FormData();
      formData.append('nome', renameFileName.trim());
      const res = await fetch(`${API_BASE}/documentos/${renameFileTarget.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId },
        body: formData,
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível renomear.`);
      const updated = await res.json();
      const newName = updated.nome_documento ?? updated.nome ?? renameFileName.trim();
      setFiles(prev => prev.map(f =>
        f.id === renameFileTarget.id ? { ...f, nome_documento: newName, nome: newName } : f
      ));
      setRenameFileTarget(null);
      setRenameFileName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────────────────────
     EXCLUIR DOCUMENTO
  ───────────────────────────────────────── */
  const deleteDocument = async () => {
    if (!deleteFileTarget) return;
    setIsSaving(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const res = await fetch(`${API_BASE}/documentos/${deleteFileTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId },
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível excluir o documento.`);
      setFiles(prev => prev.filter(f => f.id !== deleteFileTarget.id));
      setDeleteFileTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────────────────────
   GERAR RESUMO COM IA (sempre cria um novo, usuário escolhe o formato)
───────────────────────────────────────── */
  const confirmGenerateSummary = async () => {
    if (!newSummaryTarget) return;
    const file = newSummaryTarget;
    setIsGenerating(true);
    setGeneratingFileId(file.id);
    setError(null);

    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      if (!bankUserId) throw new Error('Não foi possível obter o ID do usuário.');

      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId };

      const postRes = await fetch(`${API_BASE}/documentos/${file.id}/resumos`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel_conhecimento: 3, formato: newSummaryFormat, tom: 'direto e claro' }),
      });
      if (!postRes.ok) throw new Error(`Erro ${postRes.status}: não foi possível gerar o resumo.`);
      const created = await postRes.json();

      setFileCounts(prev => ({
        ...prev,
        [file.id]: { ...(prev[file.id] || { flashcards: 0, quizzes: 0 }), resumos: (prev[file.id]?.resumos ?? 0) + 1 },
      }));

      const contentRes = await fetch(`${API_BASE}/resumos/${created.id}/conteudo`, { headers });
      if (!contentRes.ok) throw new Error(`Erro ${contentRes.status}: não foi possível ler o resumo.`);
      const contentData = await contentRes.json();

      setSummaryText(contentData.conteudo || 'Nenhum conteúdo de resumo.');
      setSummaryFileName(file.nome_documento ?? file.nome);
      setSummaryResumoId(created.id);
      setSummaryReturnTo(file);
      setNewSummaryTarget(null);
      setShowSummaryModal(true);
    } catch (err) {
      console.error('CATCH:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setGeneratingFileId(null);
    }
  };

  /* ── Visualiza um resumo já gerado (a partir da listagem) ── */
  const viewResumo = async (item) => {
    const originFile = contentModal?.file;
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId };
      const res = await fetch(`${API_BASE}/resumos/${item.id}/conteudo`, { headers });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível ler o resumo.`);
      const data = await res.json();
      setSummaryText(data.conteudo || 'Nenhum conteúdo de resumo.');
      setSummaryFileName(item.titulo);
      setSummaryResumoId(item.id);
      setSummaryReturnTo(originFile ?? null);
      closeContentModal();
      setShowSummaryModal(true);
    } catch (err) {
      setContentModalError(err.message);
    }
  };

  /* ── Baixa o PDF de um resumo (gerado sob demanda se ainda não existir) ── */
  const downloadResumoPdf = async (resumoId) => {
    setIsDownloadingPdf(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId };
      const res = await fetch(`${API_BASE}/resumos/${resumoId}/download`, { headers });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível gerar o PDF.`);
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /* ─────────────────────────────────────────
     LISTAGEM POR TIPO (resumos/flashcards/quizzes de um documento)
  ───────────────────────────────────────── */
  const openContentModal = async (file, tipo) => {
    setContentModal({ file, tipo });
    setContentModalItems([]);
    setContentModalError('');
    setIsLoadingContent(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId };

      const res = await fetch(`${API_BASE}/documentos/${file.id}/${tipo}`, { headers });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível carregar a lista.`);
      const data = await res.json();
      setContentModalItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setContentModalError(err.message);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const closeContentModal = () => {
    setContentModal(null);
    setContentModalItems([]);
    setContentModalError('');
  };

  /* ── Fecha a visualização de resumo, voltando pra lista de origem (se houver) ── */
  const closeSummaryModal = () => {
    const returnFile = summaryReturnTo;
    setShowSummaryModal(false);
    setSummaryText('');
    setSummaryFileName('');
    setSummaryResumoId(null);
    setSummaryReturnTo(null);
    if (returnFile) openContentModal(returnFile, 'resumos');
  };

  /* ── Geração rápida de flashcard/quiz direto do Document Hub ── */
  const quickGenerateContent = async () => {
    if (!contentModal) return;
    const { file, tipo } = contentModal;
    setIsQuickGenerating(true);
    setContentModalError('');
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId, 'Content-Type': 'application/json' };

      const res = await fetch(`${API_BASE}/documentos/${file.id}/${tipo}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ quantidade: 10, dificuldade: 'medio' }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível gerar.`);
      const created = await res.json();

      setContentModalItems(prev => [created, ...prev]);
      setFileCounts(prev => ({
        ...prev,
        [file.id]: { ...(prev[file.id] || { resumos: 0, flashcards: 0, quizzes: 0 }), [tipo]: (prev[file.id]?.[tipo] ?? 0) + 1 },
      }));
    } catch (err) {
      setContentModalError(err.message);
    } finally {
      setIsQuickGenerating(false);
    }
  };

  const saveRenameContent = async () => {
    if (!renameContentTarget || !renameContentTitle.trim()) return;
    setIsSavingContent(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const { tipo, id } = renameContentTarget;
      const res = await fetch(`${API_BASE}/${tipo}/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': bankUserId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ titulo: renameContentTitle.trim() }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível renomear.`);
      const updated = await res.json();
      setContentModalItems(prev => prev.map(it => it.id === id ? { ...it, titulo: updated.titulo } : it));
      setRenameContentTarget(null);
      setRenameContentTitle('');
    } catch (err) {
      setContentModalError(err.message);
    } finally {
      setIsSavingContent(false);
    }
  };

  const confirmDeleteContent = async () => {
    if (!deleteContentTarget) return;
    setIsSavingContent(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = dbUserId || await getBankUserId(token);
      const { tipo, id } = deleteContentTarget;
      const res = await fetch(`${API_BASE}/${tipo}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId },
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível excluir.`);
      setContentModalItems(prev => prev.filter(it => it.id !== id));
      if (contentModal) {
        setFileCounts(prev => {
          const current = prev[contentModal.file.id] || { resumos: 0, flashcards: 0, quizzes: 0 };
          return { ...prev, [contentModal.file.id]: { ...current, [tipo]: Math.max(0, (current[tipo] ?? 1) - 1) } };
        });
      }
      setDeleteContentTarget(null);
    } catch (err) {
      setContentModalError(err.message);
    } finally {
      setIsSavingContent(false);
    }
  };

  /* ─────────────────────────────────────────
     ABRIR DOCUMENTO (Visualização Segura)
  ───────────────────────────────────────── */
  const handleOpenDocument = async (file) => {
    try {
      const { token } = await getAuthHeaders();
      
      // Enviando a requisição com o cabeçalho 'X-User-Id' que estava no Swagger
      const res = await fetch(`${API_BASE}/documentos/${file.id}/url-visualizacao`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': dbUserId // Passando o ID do banco que você já salvou no estado!
        }
      });

      // Se der erro, agora nós vamos ler exatamente o que o Python reclamou
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Status ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      
      // Procura a URL na resposta do Back-end
      const urlFinal = data.url || data.url_visualizacao || data.link || Object.values(data)[0];

      if (urlFinal && typeof urlFinal === 'string') {
        window.open(urlFinal, '_blank');
      } else {
        throw new Error('O servidor não enviou a URL. Resposta: ' + JSON.stringify(data));
      }

    } catch (err) {
      // O alert agora vai mostrar o código do erro e a mensagem real do servidor
      alert(`Detalhes do erro: ${err.message}`);
      console.error(err);
    }
  };

  /* ─────────────────────────────────────────
     4. UPLOAD DE DOCUMENTO
  ───────────────────────────────────────── */
  const uploadDocument = async () => {
    if (!uploadFile || !uploadFolderId) return;
    setIsUploading(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = await getBankUserId(token);

      if (!bankUserId) throw new Error('Não foi possível obter o ID do usuário.');

      const formData = new FormData();
      formData.append('documento', uploadFile);
      formData.append('pasta_id', uploadFolderId);
      formData.append('nome_documento', uploadName.trim() || uploadFile.name);

      const res = await fetch(`${API_BASE}/documentos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId },
        body: formData,
      });
      if (!res.ok) throw new Error(`Erro ${res.status}: falha no upload.`);
      const novoArquivo = await res.json();
      setFiles((prev) => [novoArquivo, ...prev]);
      setUploadFolderId(null);
      setUploadFile(null);
      setUploadName('');
      window.dispatchEvent(new CustomEvent('brightedtech:docs-tour-unlock'));
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

        <div className="dp-header__actions" data-tour="dp-header-actions">
          {currentFolderId && (
            <button
              className="dp-btn dp-btn--upload"
              data-tour="dp-upload"
              onClick={() => setUploadFolderId(currentFolderId)}
            >
              {Icon.upload}
              Enviar arquivo
            </button>
          )}
          <button
            className="dp-btn dp-btn--primary"
            data-tour="dp-new-folder"
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
        <div className="dp-empty" data-tour="dp-empty">
          <div className="dp-empty__icon">{Icon.folder}</div>
          <p className="dp-empty__title">Nenhuma pasta por aqui</p>
          <p className="dp-empty__sub">Crie sua primeira pasta para organizar seus documentos.</p>
          <button
            className="dp-btn dp-btn--primary"
            data-tour="dp-new-folder"
            onClick={() => setShowNewFolderModal(true)}
          >
            {Icon.plus} Criar pasta
          </button>
        </div>
      )}

      {/* ── Grade de pastas ── */}
      {!isLoading && folders.length > 0 && (
        <section className="dp-section">
          {breadcrumb.length > 0 && <h2 className="dp-section__label">Pastas</h2>}
          <div className="dp-grid" data-tour="dp-folder-grid">
            {folders.map((folder, folderIndex) => (
              <div
                key={folder.id}
                className={`dp-card dp-card--folder${openMenuId === folder.id ? ' dp-card--menu-open' : ''}`}
                data-tour={folderIndex === 0 ? 'dp-first-folder' : undefined}
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
                        : ''}
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

      {/* ── Lista de arquivos (dentro de uma pasta) ── */}
      {!isLoading && files.length > 0 && (
        <section className="dp-section">
          <h2 className="dp-section__label">Arquivos</h2>
          <ul className="dp-file-list" data-tour="dp-file-list">
            {files.map((file, fileIndex) => {
              const isThisGenerating = isGenerating && generatingFileId === file.id;
              const counts = fileCounts[file.id];
              const displayName = file.nome_documento ?? file.nome;
              const isFirstFile = fileIndex === 0;
              return (
                <li
                  key={file.id}
                  className={`dp-file-item${isThisGenerating ? ' dp-file-item--generating' : ''}`}
                >
                  {/* Nome do arquivo (clicável para visualizar) */}
                  <button
                    className="dp-file-item__name"
                    onClick={() => handleOpenDocument(file)}
                    title="Clique para visualizar o documento"
                  >
                    <span className="dp-file-item__file-icon">{Icon.file}</span>
                    <span className="dp-file-item__label">{displayName}</span>
                  </button>

                  {/* Botões de ação */}
                  <div className="dp-file-item__actions">
                    {/* Botão IA — gerar resumo */}
                    <button
                      className="dp-file-item__ai-btn"
                      data-tour={isFirstFile ? 'dp-file-ai' : undefined}
                      onClick={() => { setNewSummaryTarget(file); setNewSummaryFormat('cornell'); }}
                      disabled={isGenerating}
                      title="Gerar novo resumo com IA"
                    >
                      {isThisGenerating ? Icon.spinner : Icon.ai}
                    </button>

                    {/* Badges de contagem (clicáveis) */}
                    <div
                      className="dp-file-item__counts"
                      data-tour={isFirstFile ? 'dp-file-counts' : undefined}
                    >
                      <button
                        type="button"
                        className="dp-file-item__count dp-file-item__count--resumos"
                        onClick={() => openContentModal(file, 'resumos')}
                      >
                        {counts?.resumos ?? 0} Resumos
                      </button>
                      <button
                        type="button"
                        className="dp-file-item__count dp-file-item__count--flashcards"
                        onClick={() => openContentModal(file, 'flashcards')}
                      >
                        {counts?.flashcards ?? 0} Flashcards
                      </button>
                      <button
                        type="button"
                        className="dp-file-item__count dp-file-item__count--quizzes"
                        onClick={() => openContentModal(file, 'quizzes')}
                      >
                        {counts?.quizzes ?? 0} Quizzes
                      </button>
                    </div>

                    {/* Editar nome */}
                    <button
                      className="dp-file-item__icon-btn"
                      onClick={() => { setRenameFileTarget({ id: file.id, nome: displayName }); setRenameFileName(displayName); }}
                      title="Renomear documento"
                      disabled={isGenerating}
                    >
                      {Icon.edit}
                    </button>

                    {/* Excluir */}
                    <button
                      className="dp-file-item__icon-btn dp-file-item__icon-btn--danger"
                      onClick={() => setDeleteFileTarget({ id: file.id, nome: displayName })}
                      title="Excluir documento"
                      disabled={isGenerating}
                    >
                      {Icon.trash}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
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

      {/* Modal: Novo Resumo (escolha de formato) */}
      {newSummaryTarget && (
        <Modal
          title="Novo Resumo"
          onClose={() => !isGenerating && setNewSummaryTarget(null)}
          onConfirm={confirmGenerateSummary}
          confirmLabel="Gerar"
          isLoading={isGenerating}
        >
          <div className="dp-modal__field">
            <label className="dp-modal__label">Formato do resumo</label>
            <div className="dp-format-options">
              {RESUMO_FORMATOS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`dp-format-btn${newSummaryFormat === opt.value ? ' dp-format-btn--selected' : ''}`}
                  onClick={() => setNewSummaryFormat(opt.value)}
                  disabled={isGenerating}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="dp-format-description">
              {RESUMO_FORMATOS.find(f => f.value === newSummaryFormat)?.description}
            </p>
          </div>
        </Modal>
      )}

      {/* Modal: Resumo do Documento */}
      {showSummaryModal && (
        <Modal
          title={`Resumo: ${summaryFileName}`}
          className="dp-modal--summary"
          onClose={closeSummaryModal}
          confirmLabel="Fechar"
          confirmDisabled={false}
          onConfirm={closeSummaryModal}
        >
          {summaryResumoId && (
            <button
              className="dp-btn dp-btn--ghost dp-summary-download-btn"
              onClick={() => downloadResumoPdf(summaryResumoId)}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>
          )}
          <div className="dp-modal__summary dp-modal__summary--markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
          </div>
        </Modal>
      )}

      {/* Modal: Renomear documento */}
      {renameFileTarget && (
        <Modal
          title="Renomear documento"
          onClose={() => { setRenameFileTarget(null); setRenameFileName(''); }}
          onConfirm={renameDocument}
          confirmLabel="Salvar"
          isLoading={isSaving}
          confirmDisabled={!renameFileName.trim()}
        >
          <div className="dp-modal__field">
            <label className="dp-modal__label" htmlFor="rename-file-input">Novo nome</label>
            <input
              id="rename-file-input"
              className="dp-modal__input"
              type="text"
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && renameDocument()}
            />
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar exclusão de documento */}
      {deleteFileTarget && (
        <Modal
          title="Excluir documento"
          onClose={() => setDeleteFileTarget(null)}
          onConfirm={deleteDocument}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={isSaving}
        >
          <p className="dp-modal__text">
            Tem certeza que deseja excluir <strong>"{deleteFileTarget.nome}"</strong>?{' '}
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}

      {/* Modal: Listagem de resumos/flashcards/quizzes de um documento */}
      {contentModal && (
        <div
          className="dp-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) closeContentModal(); }}
        >
          <div className="dp-modal dp-modal--content-list">
            <div className="dp-modal__header">
              <h2 className="dp-modal__title">
                {CONTENT_LABELS[contentModal.tipo].plural} — {contentModal.file.nome_documento ?? contentModal.file.nome}
              </h2>
              <button className="dp-modal__close" onClick={closeContentModal} aria-label="Fechar">✕</button>
            </div>
            <div className="dp-modal__body">
              <button
                type="button"
                className="dp-btn dp-btn--ghost dp-content-list__generate-btn"
                disabled={isQuickGenerating}
                onClick={() => {
                  if (contentModal.tipo === 'resumos') {
                    const file = contentModal.file;
                    closeContentModal();
                    setNewSummaryTarget(file);
                    setNewSummaryFormat('cornell');
                  } else {
                    quickGenerateContent();
                  }
                }}
              >
                {isQuickGenerating ? 'Gerando com IA...' : `+ Gerar novo ${CONTENT_LABELS[contentModal.tipo].singular.toLowerCase()}`}
              </button>
              {contentModalError && (
                <p className="dp-modal__text" style={{ color: '#c53030' }}>{contentModalError}</p>
              )}
              {isLoadingContent ? (
                <p className="dp-modal__text">Carregando...</p>
              ) : contentModalItems.length === 0 ? (
                <p className="dp-modal__text">
                  Nenhum {CONTENT_LABELS[contentModal.tipo].singular.toLowerCase()} gerado para este documento ainda.
                </p>
              ) : (
                <ul className="dp-content-list">
                  {contentModalItems.map((item) => (
                    <li key={item.id} className="dp-content-list__item">
                      <div className="dp-content-list__info">
                        <span className="dp-content-list__title">{item.titulo}</span>
                        <span className="dp-content-list__meta">
                          Criado em {formatDate(item.criado_em)}
                          {contentModal.tipo === 'resumos' && item.formato && ` · ${item.formato} · nível ${item.nivel_conhecimento}`}
                        </span>
                      </div>
                      <div className="dp-content-list__actions">
                        {contentModal.tipo !== 'resumos' && (
                          <button
                            className="dp-file-item__icon-btn"
                            title="Visualizar"
                            onClick={() => {
                              const tipo = contentModal.tipo === 'flashcards' ? 'flashcard' : 'quiz';
                              setStudyItem({ id: item.id, titulo: item.titulo, tipo });
                              closeContentModal();
                            }}
                          >
                            {Icon.eye}
                          </button>
                        )}
                        {contentModal.tipo === 'resumos' && (
                          <>
                            <button
                              className="dp-file-item__icon-btn"
                              title="Visualizar"
                              onClick={() => viewResumo(item)}
                            >
                              {Icon.eye}
                            </button>
                            <button
                              className="dp-file-item__icon-btn"
                              title="Baixar PDF"
                              onClick={() => downloadResumoPdf(item.id)}
                              disabled={isDownloadingPdf}
                            >
                              {Icon.download}
                            </button>
                          </>
                        )}
                        <button
                          className="dp-file-item__icon-btn"
                          title="Renomear"
                          onClick={() => { setRenameContentTarget({ tipo: contentModal.tipo, id: item.id, titulo: item.titulo }); setRenameContentTitle(item.titulo); }}
                        >
                          {Icon.edit}
                        </button>
                        <button
                          className="dp-file-item__icon-btn dp-file-item__icon-btn--danger"
                          title="Excluir"
                          onClick={() => setDeleteContentTarget({ tipo: contentModal.tipo, id: item.id, titulo: item.titulo })}
                        >
                          {Icon.trash}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Renomear resumo/flashcard/quiz */}
      {renameContentTarget && (
        <Modal
          title={`Renomear ${CONTENT_LABELS[renameContentTarget.tipo].singular.toLowerCase()}`}
          onClose={() => { setRenameContentTarget(null); setRenameContentTitle(''); }}
          onConfirm={saveRenameContent}
          confirmLabel="Salvar"
          isLoading={isSavingContent}
          confirmDisabled={!renameContentTitle.trim()}
        >
          <div className="dp-modal__field">
            <label className="dp-modal__label" htmlFor="rename-content-input">Novo título</label>
            <input
              id="rename-content-input"
              className="dp-modal__input"
              type="text"
              value={renameContentTitle}
              onChange={(e) => setRenameContentTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveRenameContent()}
            />
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar exclusão de resumo/flashcard/quiz */}
      {deleteContentTarget && (
        <Modal
          title={`Excluir ${CONTENT_LABELS[deleteContentTarget.tipo].singular.toLowerCase()}`}
          onClose={() => setDeleteContentTarget(null)}
          onConfirm={confirmDeleteContent}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={isSavingContent}
        >
          <p className="dp-modal__text">
            Tem certeza que deseja excluir <strong>"{deleteContentTarget.titulo}"</strong>?{' '}
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}

      {/* Modal: Estudo de flashcard/quiz (a partir do Document Hub) */}
      {studyItem && (
        <StudyModal item={studyItem} tipo={studyItem.tipo} onClose={() => setStudyItem(null)} />
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