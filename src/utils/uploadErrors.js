const CODIGO_CONTEUDO_NAO_PERMITIDO = 1005;
const CODIGO_MODERACAO_INDISPONIVEL = 9004;

export function getUploadErrorTitle(code) {
  if (code === CODIGO_CONTEUDO_NAO_PERMITIDO) return 'Conteúdo não permitido';
  if (code === CODIGO_MODERACAO_INDISPONIVEL) return 'Serviço temporariamente indisponível';
  return 'Não foi possível enviar o documento';
}

export function uploadErrorFrom(corpoErro, fallback) {
  const err = new Error(corpoErro?.errors?.[0]?.message || corpoErro?.detail || fallback);
  err.code = corpoErro?.error_code;
  err.title = getUploadErrorTitle(err.code);
  return err;
}
