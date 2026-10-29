/** Executa fn para cada item com no máximo `limite` chamadas ao mesmo tempo; mantém a ordem dos resultados. */
export async function mapComLimite(itens, limite, fn) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await fn(itens[i], i);
    }
  });
  await Promise.all(trabalhadores);
  return resultados;
}
