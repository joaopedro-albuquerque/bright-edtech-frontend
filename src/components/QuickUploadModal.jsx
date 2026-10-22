import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './QuickUploadModal.css';
import { API_BASE } from '../config';
import { validatePdfFile } from '../utils/pdfValidation';
import { uploadErrorFrom, getUploadErrorTitle } from '../utils/uploadErrors';
import AlertModal from './AlertModal';

const NEW_FOLDER_VALUE = '__new__';

async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens.idToken.toString();
  return { token };
}

/**
 * Modal de upload rápido: combina seleção de pasta existente, criação de
 * pasta inline, e upload de arquivo em um único passo, sem navegar até a
 * página de Gestão de Documentos.
 *
 * Props:
 *  - dbUserId: UUID do usuário no banco (obrigatório)
 *  - onClose(): fecha o modal
 *  - onUploaded(documento): chamado após upload bem-sucedido
 */
export default function QuickUploadModal({ dbUserId, onClose, onUploaded }) {
  const [folders, setFolders] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadAlert, setUploadAlert] = useState(null);

  useEffect(() => {
    (async () => {
      setIsLoadingFolders(true);
      try {
        const { token } = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/pastas/user/${dbUserId}/todas`, {
          headers: { Authorization: `Bearer ${token}`, 'X-User-Id': dbUserId },
        });
        if (!res.ok) throw new Error('Erro ao carregar pastas.');
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingFolders(false);
      }
    })();
  }, [dbUserId]);

  const isCreatingFolder = selectedFolderId === NEW_FOLDER_VALUE;
  const canSubmit = !!file
    && (isCreatingFolder ? newFolderName.trim().length > 0 : !!selectedFolderId)
    && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { token } = await getAuthHeaders();
      let pastaId = selectedFolderId;

      if (isCreatingFolder) {
        const res = await fetch(`${API_BASE}/pastas`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': dbUserId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nome: newFolderName.trim(), pasta_pai_id: null }),
        });
        if (!res.ok) throw new Error('Não foi possível criar a pasta.');
        const nova = await res.json();
        pastaId = nova.id;
      }

      const formData = new FormData();
      formData.append('documento', file);
      formData.append('pasta_id', pastaId);
      formData.append('nome_documento', docName.trim() || file.name);

      const uploadRes = await fetch(`${API_BASE}/documentos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': dbUserId },
        body: formData,
      });
      if (!uploadRes.ok) {
        const corpoErro = await uploadRes.json().catch(() => null);
        throw uploadErrorFrom(corpoErro, 'Não foi possível enviar o documento.');
      }
      const documento = await uploadRes.json();

      onUploaded?.(documento);
      onClose();
    } catch (err) {
      setUploadAlert({ title: err.title || getUploadErrorTitle(), message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="qu-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qu-modal">
        <div className="qu-modal__header">
          <h2 className="qu-modal__title">Upload rápido</h2>
          <button className="qu-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="qu-modal__body">
          {error && <p className="qu-modal__error">{error}</p>}

          <div className="qu-field">
            <label className="qu-field__label" htmlFor="qu-folder">Pasta de destino</label>
            {isLoadingFolders ? (
              <p className="qu-field__hint">Carregando pastas...</p>
            ) : (
              <select
                id="qu-folder"
                className="qu-field__input"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
              >
                <option value="" disabled>Selecione uma pasta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
                <option value={NEW_FOLDER_VALUE}>+ Criar nova pasta</option>
              </select>
            )}
          </div>

          {isCreatingFolder && (
            <div className="qu-field">
              <label className="qu-field__label" htmlFor="qu-new-folder">Nome da nova pasta</label>
              <input
                id="qu-new-folder"
                className="qu-field__input"
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Biologia - 3º Ano"
                autoFocus
              />
            </div>
          )}

          <div className="qu-field">
            <label className="qu-field__label" htmlFor="qu-file">Arquivo (PDF)</label>
            <label className="qu-upload-area" htmlFor="qu-file">
              {file ? <span>{file.name}</span> : <span>Clique para escolher um arquivo</span>}
              <input
                id="qu-file"
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  const validationError = validatePdfFile(f);
                  if (validationError) {
                    setError(validationError);
                    setFile(null);
                    e.target.value = '';
                    return;
                  }
                  setError('');
                  setFile(f);
                  if (!docName) setDocName(f.name);
                }}
              />
            </label>
            <p className="qu-field__hint">PDF, até 5MB.</p>
          </div>

          <div className="qu-field">
            <label className="qu-field__label" htmlFor="qu-name">
              Nome do documento <span className="qu-field__optional">(opcional)</span>
            </label>
            <input
              id="qu-name"
              className="qu-field__input"
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Deixe em branco para usar o nome do arquivo"
            />
          </div>
        </div>

        <div className="qu-modal__footer">
          <button className="qu-btn qu-btn--ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button className="qu-btn qu-btn--primary" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
    {uploadAlert && (
      <AlertModal
        title={uploadAlert.title}
        message={uploadAlert.message}
        onClose={() => setUploadAlert(null)}
      />
    )}
    </>
  );
}
