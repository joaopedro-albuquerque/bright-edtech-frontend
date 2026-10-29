import { useMemo, useState } from 'react';
import CampoBusca from './CampoBusca';
import { buscarPastas, formatarCaminho, montarArvore } from '../utils/arvorePastas';
import './SeletorPasta.css';

const Icone = {
  pasta: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2.5 5.5a1.5 1.5 0 0 1 1.5-1.5h3.2l1.6 1.8H16a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-8.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  seta: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ok: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  mais: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * Escolha de pasta em árvore: lista as pastas sem pai, entra nas filhas ao tocar e permite buscar pelo nome
 * (o resultado mostra o caminho completo, então pastas com o mesmo nome não se confundem).
 *
 * `valor`: { modo: 'existente', id } | { modo: 'nova', paiId } | null
 */
export default function SeletorPasta({ pastas, valor, onChange, permitirNova = false }) {
  const arvore = useMemo(() => montarArvore(pastas), [pastas]);
  const [nivelId, setNivelId] = useState(null);
  const [termo, setTermo] = useState('');

  const buscando = termo.trim() !== '';
  const resultados = useMemo(() => (buscando ? buscarPastas(arvore, termo) : []), [arvore, termo, buscando]);
  const trilha = nivelId ? arvore.caminhoDe(nivelId) : [];
  const trilhaIds = useMemo(() => {
    const ids = [];
    let atual = nivelId ? arvore.porId.get(nivelId) : null;
    while (atual && ids.length < 30) {
      ids.unshift(atual.id);
      atual = atual.pasta_pai_id ? arvore.porId.get(atual.pasta_pai_id) : null;
    }
    return ids;
  }, [arvore, nivelId]);

  const escolhida = valor?.modo === 'existente' ? valor.id : null;

  const resumoDestino = () => {
    if (!valor) return null;
    if (valor.modo === 'existente') return formatarCaminho(arvore.caminhoDe(valor.id));
    const pai = valor.paiId ? formatarCaminho(arvore.caminhoDe(valor.paiId)) : 'Início';
    return `Nova pasta em ${pai}`;
  };
  const destino = resumoDestino();

  const abrirOuEscolher = (pasta) => {
    if (arvore.quantidadeFilhos(pasta.id) > 0) setNivelId(pasta.id);
    else onChange({ modo: 'existente', id: pasta.id });
  };

  const escolherDaBusca = (pasta) => {
    onChange({ modo: 'existente', id: pasta.id });
    setTermo('');
    setNivelId(pasta.pasta_pai_id ?? null);
  };

  const filhos = arvore.filhosDe(nivelId);
  const nomeNivel = nivelId ? arvore.porId.get(nivelId)?.nome : null;

  return (
    <div className="sp">
      <div className={`sp-destino${destino ? ' sp-destino--ok' : ''}`} aria-live="polite">
        <span className="sp-destino__label">Destino</span>
        <span className="sp-destino__valor">{destino ?? 'Nenhuma pasta escolhida'}</span>
      </div>

      <CampoBusca valor={termo} onChange={setTermo} placeholder="Buscar pasta pelo nome…" ariaLabel="Buscar pasta" />

      {buscando ? (
        <ul className="sp-lista" role="list">
          {resultados.length === 0 && (
            <li className="sp-vazio">Nenhuma pasta encontrada para <strong>“{termo.trim()}”</strong>.</li>
          )}
          {resultados.map(({ pasta, caminho }) => (
            <li key={pasta.id}>
              <button type="button" className={`sp-item${escolhida === pasta.id ? ' sp-item--ativo' : ''}`} onClick={() => escolherDaBusca(pasta)}>
                <span className="sp-item__icone">{Icone.pasta}</span>
                <span className="sp-item__texto">
                  <span className="sp-item__nome">{pasta.nome}</span>
                  {caminho.length > 1 && (
                    <span className="sp-item__caminho">em {formatarCaminho(caminho.slice(0, -1))}</span>
                  )}
                </span>
                {escolhida === pasta.id && <span className="sp-item__ok">{Icone.ok}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <nav className="sp-trilha" aria-label="Localização">
            <button type="button" className={`sp-trilha__item${nivelId ? '' : ' sp-trilha__item--atual'}`} onClick={() => setNivelId(null)}>
              Início
            </button>
            {trilhaIds.map((id, i) => (
              <span key={id} className="sp-trilha__segmento">
                <span className="sp-trilha__sep" aria-hidden="true">{Icone.seta}</span>
                <button
                  type="button"
                  className={`sp-trilha__item${i === trilhaIds.length - 1 ? ' sp-trilha__item--atual' : ''}`}
                  onClick={() => setNivelId(id)}
                >
                  {trilha[i]}
                </button>
              </span>
            ))}
          </nav>

          <ul className="sp-lista" role="list">
            {nivelId && (
              <li>
                <button
                  type="button"
                  className={`sp-item sp-item--aqui${escolhida === nivelId ? ' sp-item--ativo' : ''}`}
                  onClick={() => onChange({ modo: 'existente', id: nivelId })}
                >
                  <span className="sp-item__icone">{Icone.pasta}</span>
                  <span className="sp-item__texto"><span className="sp-item__nome">Usar “{nomeNivel}” como destino</span></span>
                  {escolhida === nivelId && <span className="sp-item__ok">{Icone.ok}</span>}
                </button>
              </li>
            )}
            {filhos.length === 0 && !nivelId && <li className="sp-vazio">Você ainda não tem pastas.</li>}
            {filhos.map((pasta) => {
              const qtd = arvore.quantidadeFilhos(pasta.id);
              return (
                <li key={pasta.id}>
                  <button
                    type="button"
                    className={`sp-item${escolhida === pasta.id ? ' sp-item--ativo' : ''}`}
                    onClick={() => abrirOuEscolher(pasta)}
                    aria-label={qtd > 0 ? `${pasta.nome}, abrir ${qtd} ${qtd === 1 ? 'subpasta' : 'subpastas'}` : `Escolher ${pasta.nome}`}
                  >
                    <span className="sp-item__icone">{Icone.pasta}</span>
                    <span className="sp-item__texto">
                      <span className="sp-item__nome">{pasta.nome}</span>
                      {qtd > 0 && <span className="sp-item__caminho">{qtd} {qtd === 1 ? 'subpasta' : 'subpastas'}</span>}
                    </span>
                    {escolhida === pasta.id && <span className="sp-item__ok">{Icone.ok}</span>}
                    {qtd > 0 && <span className="sp-item__abrir">{Icone.seta}</span>}
                  </button>
                </li>
              );
            })}
            {permitirNova && (
              <li>
                <button
                  type="button"
                  className={`sp-item sp-item--nova${valor?.modo === 'nova' && (valor.paiId ?? null) === (nivelId ?? null) ? ' sp-item--ativo' : ''}`}
                  onClick={() => onChange({ modo: 'nova', paiId: nivelId })}
                >
                  <span className="sp-item__icone">{Icone.mais}</span>
                  <span className="sp-item__texto">
                    <span className="sp-item__nome">Criar nova pasta {nivelId ? `em “${nomeNivel}”` : 'aqui'}</span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
