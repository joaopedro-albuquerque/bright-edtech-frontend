import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config';
import './PdfViewer.css';

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const LARGURA_MINIATURA = 112;
const LARGURA_MINIMA_PARA_MINIATURAS = 900;
const MARGEM_LATERAL = 24;

const Icone = {
  fechar: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  baixar: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2.5v8.2M5.5 7.5L9 11l3.5-3.5M3 14.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  mais: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  menos: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  miniaturas: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="10.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 4h5M10.5 7h5M10.5 11h5M10.5 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

function nomeDeArquivo(titulo) {
  const limpo = (titulo || 'documento').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return `${limpo || 'documento'}.pdf`;
}

/** Observa se o elemento está perto da área visível, para só desenhar as páginas que importam. */
function usePerto(ref, margem) {
  const [perto, setPerto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(([entrada]) => setPerto(entrada.isIntersecting), { rootMargin: margem });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, margem]);
  return perto;
}

function Pagina({ doc, numero, larguraBase, zoom, razao }) {
  const caixaRef = useRef(null);
  const canvasRef = useRef(null);
  const perto = usePerto(caixaRef, '900px 0px');
  const [tamanho, setTamanho] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!perto || !larguraBase) {
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      return undefined;
    }
    let cancelado = false;
    let tarefa = null;
    (async () => {
      const pagina = await doc.getPage(numero);
      if (cancelado) return;
      const base = pagina.getViewport({ scale: 1 });
      const escala = (larguraBase * zoom) / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pagina.getViewport({ scale: escala * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const largura = viewport.width / dpr;
      const altura = viewport.height / dpr;
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;
      setTamanho({ largura, altura });
      tarefa = pagina.render({ canvasContext: canvas.getContext('2d'), viewport });
      await tarefa.promise;
    })().catch((erro) => {
      if (erro?.name !== 'RenderingCancelledException') console.error('Falha ao desenhar a página', numero, erro);
    });
    return () => {
      cancelado = true;
      tarefa?.cancel();
    };
  }, [perto, doc, numero, larguraBase, zoom]);

  const larguraReservada = larguraBase * zoom;
  const estilo = tamanho && perto
    ? { width: tamanho.largura, height: tamanho.altura }
    : { width: larguraReservada, height: larguraReservada * razao };

  return (
    <div className="pv-page" data-pagina={numero} ref={caixaRef} style={estilo}>
      <canvas ref={canvasRef} aria-label={`Página ${numero}`} />
    </div>
  );
}

function Miniatura({ doc, numero, ativa, onEscolher }) {
  const caixaRef = useRef(null);
  const canvasRef = useRef(null);
  const perto = usePerto(caixaRef, '400px 0px');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!perto) return undefined;
    let cancelado = false;
    let tarefa = null;
    (async () => {
      const pagina = await doc.getPage(numero);
      if (cancelado) return;
      const base = pagina.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pagina.getViewport({ scale: (LARGURA_MINIATURA / base.width) * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;
      tarefa = pagina.render({ canvasContext: canvas.getContext('2d'), viewport });
      await tarefa.promise;
    })().catch(() => {});
    return () => {
      cancelado = true;
      tarefa?.cancel();
    };
  }, [perto, doc, numero]);

  return (
    <button
      type="button"
      ref={caixaRef}
      className={`pv-thumb${ativa ? ' pv-thumb--active' : ''}`}
      onClick={() => onEscolher(numero)}
      aria-label={`Ir para a página ${numero}`}
      aria-current={ativa ? 'page' : undefined}
    >
      <span className="pv-thumb__canvas"><canvas ref={canvasRef} /></span>
      <span className="pv-thumb__num">{numero}</span>
    </button>
  );
}

/**
 * Visualizador de PDF em tela cheia (pdf.js).
 * `path` é o caminho da API que devolve os bytes do PDF; `getHeaders` devolve os cabeçalhos de autenticação.
 */
export default function PdfViewer({ titulo, path, getHeaders, onClose }) {
  const [estado, setEstado] = useState('carregando'); // carregando | pronto | erro
  const [erro, setErro] = useState('');
  const [doc, setDoc] = useState(null);
  const [total, setTotal] = useState(0);
  const [razao, setRazao] = useState(1.414);
  const [zoom, setZoom] = useState(1);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [larguraBase, setLarguraBase] = useState(0);
  const [mostrarMiniaturas, setMostrarMiniaturas] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= LARGURA_MINIMA_PARA_MINIATURAS
  );
  const [tentativa, setTentativa] = useState(0);

  const rolagemRef = useRef(null);
  const overlayRef = useRef(null);
  const bytesRef = useRef(null);
  const getHeadersRef = useRef(getHeaders);
  useEffect(() => { getHeadersRef.current = getHeaders; });

  // Trava a rolagem da página de fundo e leva o foco para dentro do diálogo (Esc e leitores de tela).
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlayRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = anterior; };
  }, []);

  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onClose]);

  // Baixa os bytes e abre o documento no pdf.js (a biblioteca só é carregada aqui).
  useEffect(() => {
    let cancelado = false;
    let documento = null;
    (async () => {
      const headers = await getHeadersRef.current();
      const resposta = await fetch(`${API_BASE}${path}`, { headers });
      if (!resposta.ok) throw new Error(`Não foi possível carregar o PDF (erro ${resposta.status}).`);
      const buffer = await resposta.arrayBuffer();
      if (cancelado) return;
      bytesRef.current = buffer;

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
      documento = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
      if (cancelado) { documento.destroy(); return; }

      const primeira = await documento.getPage(1);
      const vp = primeira.getViewport({ scale: 1 });
      setRazao(vp.height / vp.width);
      setDoc(documento);
      setTotal(documento.numPages);
      setEstado('pronto');
    })().catch((e) => {
      if (cancelado) return;
      setErro(e.message || 'Não foi possível abrir o PDF.');
      setEstado('erro');
    });
    return () => {
      cancelado = true;
      documento?.destroy();
    };
  }, [path, tentativa]);

  // Largura útil para "ajustar à tela".
  useEffect(() => {
    const el = rolagemRef.current;
    if (!el || estado !== 'pronto') return undefined;
    const medir = () => setLarguraBase(Math.max(el.clientWidth - MARGEM_LATERAL, 160));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [estado]);

  const atualizarPaginaAtual = useCallback(() => {
    const el = rolagemRef.current;
    if (!el) return;
    const limite = el.scrollTop + el.clientHeight / 3;
    let atual = 1;
    el.querySelectorAll('.pv-page').forEach((p) => {
      if (p.offsetTop <= limite) atual = Number(p.dataset.pagina);
    });
    setPaginaAtual(atual);
  }, []);

  const irParaPagina = useCallback((n) => {
    const el = rolagemRef.current;
    const alvo = el?.querySelector(`.pv-page[data-pagina="${n}"]`);
    if (!el || !alvo) return;
    el.scrollTo({ top: alvo.offsetTop - 8, behavior: 'smooth' });
  }, []);

  const mudarZoom = (direcao) => {
    const i = ZOOMS.indexOf(zoom);
    const proximo = ZOOMS[Math.min(Math.max(i + direcao, 0), ZOOMS.length - 1)];
    setZoom(proximo);
  };

  const baixar = () => {
    if (!bytesRef.current) return;
    const url = URL.createObjectURL(new Blob([bytesRef.current], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeDeArquivo(titulo);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const paginas = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="pv-overlay" role="dialog" aria-modal="true" aria-label={`Visualizando ${titulo}`} tabIndex={-1} ref={overlayRef}>
      <header className="pv-bar">
        <button type="button" className="pv-btn" onClick={onClose} aria-label="Fechar visualizador">
          {Icone.fechar}
        </button>
        <h2 className="pv-title" title={titulo}>{titulo}</h2>

        {estado === 'pronto' && (
          <div className="pv-tools">
            <button
              type="button"
              className="pv-btn pv-btn--thumbs"
              onClick={() => setMostrarMiniaturas((v) => !v)}
              aria-pressed={mostrarMiniaturas}
              aria-label="Mostrar ou ocultar miniaturas"
            >
              {Icone.miniaturas}
            </button>
            <span className="pv-pages" aria-live="polite">{paginaAtual} / {total}</span>
            <div className="pv-zoom">
              <button type="button" className="pv-btn" onClick={() => mudarZoom(-1)} disabled={zoom <= ZOOMS[0]} aria-label="Diminuir zoom">{Icone.menos}</button>
              <span className="pv-zoom__valor">{Math.round(zoom * 100)}%</span>
              <button type="button" className="pv-btn" onClick={() => mudarZoom(1)} disabled={zoom >= ZOOMS[ZOOMS.length - 1]} aria-label="Aumentar zoom">{Icone.mais}</button>
            </div>
            <button type="button" className="pv-btn" onClick={baixar} aria-label="Baixar PDF">{Icone.baixar}</button>
          </div>
        )}
      </header>

      <div className="pv-body">
        {estado === 'pronto' && mostrarMiniaturas && (
          <nav className="pv-thumbs" aria-label="Miniaturas das páginas">
            {paginas.map((n) => (
              <Miniatura key={n} doc={doc} numero={n} ativa={n === paginaAtual} onEscolher={irParaPagina} />
            ))}
          </nav>
        )}

        <div className="pv-scroll" ref={rolagemRef} onScroll={atualizarPaginaAtual}>
          {estado === 'carregando' && (
            <div className="pv-status" role="status">
              <span className="pv-spinner" aria-hidden="true" />
              Carregando PDF…
            </div>
          )}
          {estado === 'erro' && (
            <div className="pv-status pv-status--erro" role="alert">
              <p>{erro}</p>
              <button type="button" className="pv-retry" onClick={() => { setEstado('carregando'); setErro(''); setTentativa((t) => t + 1); }}>Tentar novamente</button>
            </div>
          )}
          {estado === 'pronto' && (
            <div className="pv-pages-list">
              {paginas.map((n) => (
                <Pagina key={n} doc={doc} numero={n} larguraBase={larguraBase} zoom={zoom} razao={razao} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
