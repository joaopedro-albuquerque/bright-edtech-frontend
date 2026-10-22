export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;

export function validatePdfFile(file) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return 'Apenas arquivos no formato PDF são permitidos.';
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return 'O arquivo excede o tamanho máximo permitido de 5MB.';
  }
  return null;
}
