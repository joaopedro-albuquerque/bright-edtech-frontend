const ordem = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Monta a árvore de pastas a partir da lista plana da API (cada pasta traz `pasta_pai_id`).
 * Os irmãos ficam em ordem alfabética; números são comparados como números ("Semestre 2" antes de "Semestre 10").
 */
export function montarArvore(pastas) {
  const porId = new Map(pastas.map((p) => [p.id, p]));
  const filhos = new Map();
  for (const pasta of pastas) {
    const pai = pasta.pasta_pai_id && porId.has(pasta.pasta_pai_id) ? pasta.pasta_pai_id : null;
    if (!filhos.has(pai)) filhos.set(pai, []);
    filhos.get(pai).push(pasta);
  }
  for (const lista of filhos.values()) lista.sort((a, b) => ordem.compare(a.nome, b.nome));

  const caminhoDe = (id) => {
    const nomes = [];
    let atual = porId.get(id);
    let guarda = 0;
    while (atual && guarda++ < 30) {
      nomes.unshift(atual.nome);
      atual = atual.pasta_pai_id ? porId.get(atual.pasta_pai_id) : null;
    }
    return nomes;
  };

  return {
    porId,
    filhosDe: (id) => filhos.get(id ?? null) ?? [],
    quantidadeFilhos: (id) => filhos.get(id)?.length ?? 0,
    caminhoDe,
  };
}

/** Pastas cujo nome contém o termo (sem acento nem diferença de maiúscula), com o caminho completo. */
export function buscarPastas(arvore, termo) {
  const alvo = normalizar(termo.trim());
  if (!alvo) return [];
  const achadas = [];
  for (const pasta of arvore.porId.values()) {
    const nome = normalizar(pasta.nome);
    if (!nome.includes(alvo)) continue;
    achadas.push({ pasta, caminho: arvore.caminhoDe(pasta.id), comecaCom: nome.startsWith(alvo) });
  }
  return achadas.sort((a, b) => {
    if (a.comecaCom !== b.comecaCom) return a.comecaCom ? -1 : 1;
    return ordem.compare(a.caminho.join(' › '), b.caminho.join(' › '));
  });
}

export function formatarCaminho(nomes) {
  return nomes.join(' › ');
}
