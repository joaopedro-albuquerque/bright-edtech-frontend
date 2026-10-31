import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import ReactMarkdown from 'react-markdown';
import AIDisclaimerBanner from '../components/AIDisclaimerBanner';
import remarkGfm from 'remark-gfm';
import './DocumentsPage.css';
import { API_BASE } from '../config';
import StudyModal from '../components/StudyModal';
import Modal from '../components/Modal';
import { RESUMO_FORMATOS } from '../constants/resumoFormatos';
import { NIVEIS_CONHECIMENTO, NIVEL_PADRAO, QUANTIDADE_PADRAO } from '../constants/geracao';
import { validatePdfFile } from '../utils/pdfValidation';
import { uploadErrorFrom, getUploadErrorTitle } from '../utils/uploadErrors';
import AlertModal from '../components/AlertModal';
import GeneratingOverlay from '../components/GeneratingOverlay';
import CampoBusca from '../components/CampoBusca';
import OpcoesGeracaoItens from '../components/OpcoesGeracaoItens';
import { useDocumentosBusca } from '../hooks/useDocumentosBusca';
import SeletorPasta from '../components/SeletorPasta';
import { montarArvore, buscarPastas, formatarCaminho } from '../utils/arvorePastas';

const PdfViewer = lazy(() => import('../components/PdfViewer'));

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

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDestino, setUploadDestino] = useState(null); // { modo: 'existente', id } | { modo: 'nova', paiId }
  const [uploadNovaPasta, setUploadNovaPasta] = useState('');
  const [todasPastas, setTodasPastas] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadAlert, setUploadAlert] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFileId, setGeneratingFileId] = useState(null);  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryFileName, setSummaryFileName] = useState('');
  const [summaryResumoId, setSummaryResumoId] = useState(null);
  const [visualizador, setVisualizador] = useState(null); // { titulo, path }
  const [newSummaryTarget, setNewSummaryTarget] = useState(null); // file
  const [newSummaryFormat, setNewSummaryFormat] = useState('cornell');
  const [newSummaryNivel, setNewSummaryNivel] = useState(NIVEL_PADRAO);
  const [quickQuantidade, setQuickQuantidade] = useState(QUANTIDADE_PADRAO);
  const [quickDificuldade, setQuickDificuldade] = useState('medio');
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
  const [gerandoTipo,        setGerandoTipo]        = useState(null); // 'flashcards' | 'quizzes'
  const [alvoGeracao,        setAlvoGeracao]        = useState(null); // { file, tipo } vindo da busca
  const [erroGeracao,        setErroGeracao]        = useState('');
  const [termoBusca,         setTermoBusca]         = useState('');
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

  /* Lista completa de pastas (busca de pastas e seletor do upload) */
  const carregarTodasPastas = useCallback(async (id) => {
    if (!id) return;
    try {
      const { token } = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/pastas/user/${id}/todas`, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': id },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTodasPastas(Array.isArray(data) ? data : []);
    } catch { /* a busca de documentos continua funcionando */ }
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
      carregarTodasPastas(bankUserId);

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
  }, [carregarTodasPastas]);

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
      // Inicializa em 0 para não mostrar placeholder enquanto a API carrega
      setFileCounts(
        Object.fromEntries(
          filesData.map((f) => [f.id, { resumos: 0, flashcards: 0, quizzes: 0 }])
        )
      );
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

  /* ── Abre uma pasta encontrada na busca, montando o rastro completo ── */
  const abrirPastaDaBusca = async (pastaId) => {
    const arvore = montarArvore(todasPastas);
    const trilha = [];
    let atual = arvore.porId.get(pastaId);
    while (atual && trilha.length < 30) {
      trilha.unshift({ id: atual.id, nome: atual.nome });
      atual = atual.pasta_pai_id ? arvore.porId.get(atual.pasta_pai_id) : null;
    }
    if (trilha.length === 0) return;
    const ok = await loadFolderContent(trilha[trilha.length - 1]);
    if (ok) {
      setBreadcrumb(trilha);
      setTermoBusca('');
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
        body: JSON.stringify({ nivel_conhecimento: newSummaryNivel, formato: newSummaryFormat, tom: 'direto e claro' }),
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

  /* ── Visualizador de PDF: resumos e documento original abrem no app ── */
  const montarHeaders = async () => {
    const { token } = await getAuthHeaders();
    const bankUserId = dbUserId || await getBankUserId(token);
    return { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId };
  };

  const buscando = termoBusca.trim() !== '';
  const pastasEncontradas = buscando ? buscarPastas(montarArvore(todasPastas), termoBusca) : [];
  const busca = useDocumentosBusca({ termo: termoBusca, ativo: true, getHeaders: montarHeaders, somenteComTermo: true });

  const visualizarResumoPdf = (resumoId, titulo) =>
    setVisualizador({ titulo: titulo || 'Resumo', path: `/resumos/${resumoId}/pdf` });

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
  const gerarItens = async (file, tipo) => {
    const headers = { ...(await montarHeaders()), 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE}/documentos/${file.id}/${tipo}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ quantidade: quickQuantidade, dificuldade: quickDificuldade }),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível gerar.`);
    const created = await res.json();
    setFileCounts(prev => ({
      ...prev,
      [file.id]: { ...(prev[file.id] || { resumos: 0, flashcards: 0, quizzes: 0 }), [tipo]: (prev[file.id]?.[tipo] ?? 0) + 1 },
    }));
    return created;
  };

  const quickGenerateContent = async () => {
    if (!contentModal) return;
    const { file, tipo } = contentModal;
    setGerandoTipo(tipo);
    setIsQuickGenerating(true);
    setContentModalError('');
    try {
      const created = await gerarItens(file, tipo);
      closeContentModal();
      const tipoEstudo = tipo === 'flashcards' ? 'flashcard' : 'quiz';
      setStudyItem({ id: created.id, titulo: created.titulo, tipo: tipoEstudo });
    } catch (err) {
      setContentModalError(err.message);
    } finally {
      setIsQuickGenerating(false);
    }
  };

  /* ── Geração a partir dos resultados da busca ── */
  const arquivoDaBusca = (doc) => ({ id: doc.id, nome: doc.nome, nome_documento: doc.nome });

  const abrirGeracaoResumo = (doc) => {
    setNewSummaryTarget(arquivoDaBusca(doc));
    setNewSummaryFormat('cornell');
    setNewSummaryNivel(NIVEL_PADRAO);
  };

  const abrirGeracaoItens = (doc, tipo) => {
    setQuickQuantidade(QUANTIDADE_PADRAO);
    setQuickDificuldade('medio');
    setErroGeracao('');
    setAlvoGeracao({ file: arquivoDaBusca(doc), tipo });
  };

  const confirmarGeracaoItens = async () => {
    if (!alvoGeracao) return;
    const { file, tipo } = alvoGeracao;
    setGerandoTipo(tipo);
    setIsQuickGenerating(true);
    setErroGeracao('');
    try {
      const created = await gerarItens(file, tipo);
      setAlvoGeracao(null);
      const tipoEstudo = tipo === 'flashcards' ? 'flashcard' : 'quiz';
      setStudyItem({ id: created.id, titulo: created.titulo, tipo: tipoEstudo });
    } catch (err) {
      setErroGeracao(err.message);
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
  const handleOpenDocument = (file) =>
    setVisualizador({ titulo: file.nome_documento ?? file.nome, path: `/documentos/${file.id}/arquivo` });

  /* ─────────────────────────────────────────
     4. UPLOAD DE DOCUMENTO
  ───────────────────────────────────────── */
  const criandoPasta = uploadDestino?.modo === 'nova';
  const podeEnviar = !!uploadFile
    && (criandoPasta ? uploadNovaPasta.trim().length > 0 : uploadDestino?.modo === 'existente');
  const paiDaNova = criandoPasta && uploadDestino.paiId
    ? formatarCaminho(montarArvore(todasPastas).caminhoDe(uploadDestino.paiId))
    : 'Início';

  const abrirUpload = () => {
    setUploadDestino(currentFolderId ? { modo: 'existente', id: currentFolderId } : null);
    setShowUploadModal(true);
    carregarTodasPastas(dbUserId);
  };

  const fecharUpload = () => {
    setShowUploadModal(false);
    setUploadDestino(null);
    setUploadNovaPasta('');
    setUploadFile(null);
    setUploadName('');
  };

  const uploadDocument = async () => {
    if (!podeEnviar) return;
    setIsUploading(true);
    try {
      const { token } = await getAuthHeaders();
      const bankUserId = await getBankUserId(token);

      if (!bankUserId) throw new Error('Não foi possível obter o ID do usuário.');

      let uploadFolderId = uploadDestino.id;
      if (criandoPasta) {
        const resPasta = await fetch(`${API_BASE}/pastas`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': bankUserId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nome: uploadNovaPasta.trim(), pasta_pai_id: uploadDestino.paiId ?? null }),
        });
        if (!resPasta.ok) throw new Error('Não foi possível criar a pasta.');
        const nova = await resPasta.json();
        uploadFolderId = nova.id;
        if ((uploadDestino.paiId ?? null) === currentFolderId) setFolders((prev) => [nova, ...prev]);
        carregarTodasPastas(dbUserId);
      }

      const formData = new FormData();
      formData.append('documento', uploadFile);
      formData.append('pasta_id', uploadFolderId);
      formData.append('nome_documento', uploadName.trim() || uploadFile.name);

      const res = await fetch(`${API_BASE}/documentos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': bankUserId },
        body: formData,
      });
      if (!res.ok) {
        const corpoErro = await res.json().catch(() => null);
        throw uploadErrorFrom(corpoErro, `Erro ${res.status}: falha no upload.`);
      }
      const novoArquivo = await res.json();
      if (uploadFolderId === currentFolderId) {
        setFiles((prev) => [novoArquivo, ...prev]);
      }
      fecharUpload();
      window.dispatchEvent(new CustomEvent('brightedtech:docs-tour-unlock'));
    } catch (err) {
      setUploadAlert({ title: err.title || getUploadErrorTitle(), message: err.message });
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
          <button
            className="dp-btn dp-btn--upload"
            data-tour="dp-upload"
            onClick={abrirUpload}
          >
            {Icon.upload}
            Enviar arquivo
          </button>
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

      {/* ── Busca de documentos em todas as pastas ── */}
      <div className="dp-search">
        <CampoBusca
          valor={termoBusca}
          onChange={setTermoBusca}
          placeholder="Buscar pasta ou documento…"
          ariaLabel="Buscar pasta ou documento"
        />
      </div>

      {buscando && (
        <section className="dp-section dp-search-results" aria-label="Resultados da busca">
          {pastasEncontradas.length > 0 && (
            <>
              <p className="dp-search-status" aria-live="polite">
                {pastasEncontradas.length} {pastasEncontradas.length === 1 ? 'pasta encontrada' : 'pastas encontradas'}
              </p>
              <ul className="dp-search-list dp-search-list--pastas" role="list">
                {pastasEncontradas.slice(0, 20).map(({ pasta, caminho }) => (
                  <li key={pasta.id} className="dp-search-item">
                    <button type="button" className="dp-search-folder" onClick={() => abrirPastaDaBusca(pasta.id)}>
                      <span className="dp-search-folder__icon">{Icon.folder}</span>
                      <span className="dp-search-item__info">
                        <span className="dp-search-item__name" title={pasta.nome}>{pasta.nome}</span>
                        {caminho.length > 1 && (
                          <span className="dp-search-item__path">{formatarCaminho(caminho.slice(0, -1))}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {pastasEncontradas.length > 20 && (
                <p className="dp-search-status">Mostrando as 20 primeiras. Refine a busca para ver as demais.</p>
              )}
            </>
          )}
          {busca.carregando && busca.itens.length === 0 && <p className="dp-search-status">Buscando…</p>}
          {!busca.carregando && busca.erro && <p className="dp-search-status dp-search-status--erro">{busca.erro}</p>}
          {!busca.carregando && !busca.erro && busca.itens.length === 0 && pastasEncontradas.length === 0 && (
            <p className="dp-search-status">Nenhuma pasta ou documento encontrado para <strong>“{busca.termoAplicado}”</strong>.</p>
          )}
          {busca.itens.length > 0 && (
            <p className="dp-search-status" aria-live="polite">
              {busca.total} {busca.total === 1 ? 'documento encontrado' : 'documentos encontrados'}
            </p>
          )}
          <ul className="dp-search-list" role="list">
            {busca.itens.map((doc) => (
              <li key={doc.id} className="dp-search-item">
                <div className="dp-search-item__info">
                  <span className="dp-search-item__name" title={doc.nome}>{doc.nome}</span>
                  {(doc.pasta_caminho || doc.pasta_nome) && (
                    <span className="dp-search-item__path">{Icon.folder} {doc.pasta_caminho || doc.pasta_nome}</span>
                  )}
                </div>
                <div className="dp-search-item__actions">
                  <button
                    type="button"
                    className="dp-file-item__icon-btn"
                    title="Visualizar PDF"
                    aria-label={`Visualizar ${doc.nome}`}
                    onClick={() => handleOpenDocument(arquivoDaBusca(doc))}
                  >
                    {Icon.eye}
                  </button>
                  <button type="button" className="dp-file-item__count dp-file-item__count--resumos" onClick={() => abrirGeracaoResumo(doc)}>
                    Gerar resumo
                  </button>
                  <button type="button" className="dp-file-item__count dp-file-item__count--flashcards" onClick={() => abrirGeracaoItens(doc, 'flashcards')}>
                    Gerar flashcards
                  </button>
                  <button type="button" className="dp-file-item__count dp-file-item__count--quizzes" onClick={() => abrirGeracaoItens(doc, 'quizzes')}>
                    Gerar quiz
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {busca.temMais && (
            <button type="button" className="dp-search-more" onClick={busca.carregarMais} disabled={busca.carregandoMais}>
              {busca.carregandoMais ? 'Carregando…' : 'Carregar mais'}
            </button>
          )}
        </section>
      )}

      {/* ── Breadcrumb ── */}
      {!buscando && (breadcrumb.length > 0) && (
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
        <AlertModal
          title="Não foi possível concluir a ação"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* ── Estado de carregamento ── */}
      {!buscando && isLoading && (
        <div className="dp-loading">
          {Icon.spinner}
          <span>Carregando...</span>
        </div>
      )}

      {/* ── Estado vazio ── */}
      {!buscando && isEmpty && (
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
      {!buscando && !isLoading && folders.length > 0 && (
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
      {!buscando && !isLoading && files.length > 0 && (
        <section className="dp-section">
          <h2 className="dp-section__label">Arquivos</h2>
          <ul className="dp-file-list" data-tour="dp-file-list">
            {files.map((file, fileIndex) => {
              const isThisGenerating = isGenerating && generatingFileId === file.id;
              const counts = fileCounts[file.id] ?? { resumos: 0, flashcards: 0, quizzes: 0 };
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
                    <div className="dp-file-item__actions-top">
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
                          {counts.resumos} {counts.resumos === 1 ? CONTENT_LABELS.resumos.singular : CONTENT_LABELS.resumos.plural}
                        </button>
                        <button
                          type="button"
                          className="dp-file-item__count dp-file-item__count--flashcards"
                          onClick={() => openContentModal(file, 'flashcards')}
                        >
                          {counts.flashcards} {counts.flashcards === 1 ? CONTENT_LABELS.flashcards.singular : CONTENT_LABELS.flashcards.plural}
                        </button>
                        <button
                          type="button"
                          className="dp-file-item__count dp-file-item__count--quizzes"
                          onClick={() => openContentModal(file, 'quizzes')}
                        >
                          {counts.quizzes} {counts.quizzes === 1 ? CONTENT_LABELS.quizzes.singular : CONTENT_LABELS.quizzes.plural}
                        </button>
                      </div>
                    </div>

                    <div className="dp-file-item__actions-bottom">
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

      {uploadAlert && (
        <AlertModal
          title={uploadAlert.title}
          message={uploadAlert.message}
          onClose={() => setUploadAlert(null)}
        />
      )}

      {/* Modal: Upload de arquivo */}
      {showUploadModal && (
        <Modal
          title="Enviar arquivo"
          onClose={fecharUpload}
          onConfirm={uploadDocument}
          confirmLabel="Enviar"
          isLoading={isUploading}
          confirmDisabled={!podeEnviar}
        >
          <div className="dp-modal__field">
            <span className="dp-modal__label">Pasta de destino</span>
            <SeletorPasta pastas={todasPastas} valor={uploadDestino} onChange={setUploadDestino} permitirNova />
          </div>
          {criandoPasta && (
            <div className="dp-modal__field">
              <label className="dp-modal__label" htmlFor="upload-nova-pasta">Nome da nova pasta</label>
              <input
                id="upload-nova-pasta"
                className="dp-modal__input"
                type="text"
                value={uploadNovaPasta}
                onChange={(e) => setUploadNovaPasta(e.target.value)}
                placeholder="Ex: Biologia - 3º Ano"
                autoFocus
              />
              <p className="dp-modal__hint">Será criada em: {paiDaNova}</p>
            </div>
          )}
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
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  const validationError = validatePdfFile(f);
                  if (validationError) {
                    setError(validationError);
                    setUploadFile(null);
                    e.target.value = '';
                    return;
                  }
                  setUploadFile(f);
                  if (!uploadName) setUploadName(f.name);
                }}
              />
            </label>
            <p className="dp-modal__hint">PDF, até 5MB.</p>
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
          <div className="dp-modal__field">
            <label className="dp-modal__label">Seu nível de conhecimento no assunto</label>
            <div className="dp-format-options">
              {NIVEIS_CONHECIMENTO.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`dp-format-btn${newSummaryNivel === opt.value ? ' dp-format-btn--selected' : ''}`}
                  onClick={() => setNewSummaryNivel(opt.value)}
                  disabled={isGenerating}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="dp-format-description">
              {NIVEIS_CONHECIMENTO.find(n => n.value === newSummaryNivel)?.description}
            </p>
          </div>
        </Modal>
      )}

      {/* Modal: gerar flashcards/quiz de um documento achado na busca */}
      {alvoGeracao && (
        <Modal
          title={alvoGeracao.tipo === 'flashcards' ? 'Gerar flashcards' : 'Gerar quiz'}
          onClose={() => !isQuickGenerating && setAlvoGeracao(null)}
          onConfirm={confirmarGeracaoItens}
          confirmLabel="Gerar"
          isLoading={isQuickGenerating}
        >
          <p className="dp-modal__text">Documento: <strong>{alvoGeracao.file.nome}</strong></p>
          <OpcoesGeracaoItens
            tipo={alvoGeracao.tipo}
            quantidade={quickQuantidade}
            onQuantidade={setQuickQuantidade}
            dificuldade={quickDificuldade}
            onDificuldade={setQuickDificuldade}
            disabled={isQuickGenerating}
          />
          {erroGeracao && <p className="dp-modal__text" style={{ color: '#c53030' }}>{erroGeracao}</p>}
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
          <AIDisclaimerBanner className="dp-modal__ai-disclaimer" />
          {summaryResumoId && (
            <button
              className="dp-btn dp-btn--ghost dp-summary-download-btn"
              onClick={() => visualizarResumoPdf(summaryResumoId, `Resumo: ${summaryFileName}`)}
            >
              Abrir em PDF
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
              {contentModal.tipo !== 'resumos' && (
                <OpcoesGeracaoItens
                  tipo={contentModal.tipo}
                  quantidade={quickQuantidade}
                  onQuantidade={setQuickQuantidade}
                  dificuldade={quickDificuldade}
                  onDificuldade={setQuickDificuldade}
                  disabled={isQuickGenerating}
                />
              )}
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
                    setNewSummaryNivel(NIVEL_PADRAO);
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
                          <button
                            className="dp-file-item__icon-btn"
                            title="Visualizar"
                            onClick={() => visualizarResumoPdf(item.id, item.titulo)}
                          >
                            {Icon.eye}
                          </button>
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

      {isGenerating && <GeneratingOverlay tipo="resumo" />}
      {visualizador && (
        <Suspense fallback={null}>
          <PdfViewer
            titulo={visualizador.titulo}
            path={visualizador.path}
            getHeaders={montarHeaders}
            onClose={() => setVisualizador(null)}
          />
        </Suspense>
      )}
      {isQuickGenerating && gerandoTipo && (
        <GeneratingOverlay tipo={gerandoTipo === 'flashcards' ? 'flashcard' : 'quiz'} />
      )}
    </div>
  );
}