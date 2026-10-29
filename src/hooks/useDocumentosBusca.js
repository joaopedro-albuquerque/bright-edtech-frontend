import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config';

const TAMANHO_PAGINA = 20;
const ESPERA_DIGITACAO_MS = 300;
const VAZIO = { termo: null, itens: [], total: 0, temMais: false };

/**
 * Busca documentos do usuário no servidor (por nome, sem acento nem diferença de maiúscula), de 20 em 20.
 * `getHeaders` devolve os cabeçalhos de autenticação; `ativo` liga/desliga a busca (ex.: modal aberto).
 * Com `somenteComTermo`, não consulta enquanto o campo estiver vazio (a tela mostra outra lista nesse caso).
 */
export function useDocumentosBusca({ termo, ativo, getHeaders, somenteComTermo = false }) {
  const [resultado, setResultado] = useState(VAZIO);
  const [falha, setFalha] = useState({ termo: null, mensagem: '' });
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [termoAplicado, setTermoAplicado] = useState(termo.trim());

  const getHeadersRef = useRef(getHeaders);
  useEffect(() => { getHeadersRef.current = getHeaders; });
  const execucaoRef = useRef(0);

  // Espera o usuário parar de digitar antes de consultar o servidor.
  useEffect(() => {
    const id = setTimeout(() => setTermoAplicado(termo.trim()), ESPERA_DIGITACAO_MS);
    return () => clearTimeout(id);
  }, [termo]);

  const buscarPagina = useCallback(async (termoBusca, offset) => {
    const headers = await getHeadersRef.current();
    const params = new URLSearchParams({ q: termoBusca, limit: String(TAMANHO_PAGINA), offset: String(offset) });
    const res = await fetch(`${API_BASE}/documentos?${params}`, { headers });
    if (!res.ok) throw new Error(`Erro ${res.status} ao buscar documentos.`);
    return res.json();
  }, []);

  const semConsulta = !ativo || (somenteComTermo && !termoAplicado);

  useEffect(() => {
    if (semConsulta) return;
    const execucao = ++execucaoRef.current;
    buscarPagina(termoAplicado, 0)
      .then((dados) => {
        if (execucao !== execucaoRef.current) return;
        setResultado({ termo: termoAplicado, itens: dados.itens, total: dados.total, temMais: dados.tem_mais });
      })
      .catch((e) => {
        if (execucao !== execucaoRef.current) return;
        setFalha({ termo: termoAplicado, mensagem: e.message });
      });
  }, [semConsulta, termoAplicado, buscarPagina]);

  const carregarMais = useCallback(async () => {
    const execucao = execucaoRef.current;
    setCarregandoMais(true);
    try {
      const dados = await buscarPagina(termoAplicado, resultado.itens.length);
      if (execucao !== execucaoRef.current) return;
      setResultado((atual) => {
        const ids = new Set(atual.itens.map((d) => d.id));
        return {
          termo: atual.termo,
          itens: [...atual.itens, ...dados.itens.filter((d) => !ids.has(d.id))],
          total: dados.total,
          temMais: dados.tem_mais,
        };
      });
    } catch (e) {
      if (execucao === execucaoRef.current) setFalha({ termo: termoAplicado, mensagem: e.message });
    } finally {
      if (execucao === execucaoRef.current) setCarregandoMais(false);
    }
  }, [buscarPagina, termoAplicado, resultado.itens.length]);

  // Tudo abaixo é derivado: resultado de outra busca (ou de nenhuma) nunca aparece como se fosse o atual.
  const doTermoAtual = !semConsulta && resultado.termo === termoAplicado;
  const erro = !semConsulta && falha.termo === termoAplicado ? falha.mensagem : '';
  const aguardandoResposta = !semConsulta && !doTermoAtual && !erro;
  const aguardandoDigitacao = termo.trim() !== termoAplicado && !(somenteComTermo && !termo.trim());
  const carregando = aguardandoResposta || aguardandoDigitacao;

  return {
    itens: doTermoAtual ? resultado.itens : [],
    total: doTermoAtual ? resultado.total : 0,
    temMais: doTermoAtual ? resultado.temMais : false,
    carregando,
    carregandoMais,
    erro,
    carregarMais,
    termoAplicado,
  };
}
