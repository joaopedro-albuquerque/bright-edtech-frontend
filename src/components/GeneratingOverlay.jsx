import { useEffect, useState } from 'react';
import './GeneratingOverlay.css';

const NOMES = { resumo: 'resumo', flashcard: 'flashcard', quiz: 'quiz' };

const ETAPAS = {
  resumo: [
    'Lendo o seu documento…',
    'Identificando os pontos principais…',
    'Escrevendo o resumo…',
  ],
  flashcard: [
    'Lendo o seu documento…',
    'Escolhendo os conceitos-chave…',
    'Montando perguntas e respostas…',
  ],
  quiz: [
    'Lendo o seu documento…',
    'Escolhendo os conceitos-chave…',
    'Elaborando questões e alternativas…',
  ],
};

const INTERVALO_ETAPA_MS = 3500;

/** Tela de espera enquanto a IA gera resumo, flashcard ou quiz. Monte só durante a geração. */
export default function GeneratingOverlay({ tipo = 'resumo' }) {
  const etapas = ETAPAS[tipo] || ETAPAS.resumo;
  const [etapa, setEtapa] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setEtapa((e) => Math.min(e + 1, etapas.length - 1)), INTERVALO_ETAPA_MS);
    return () => clearInterval(id);
  }, [etapas.length]);

  return (
    <div className="gen-overlay" role="status" aria-live="polite">
      <div className="gen-card">
        <div className="gen-orb" aria-hidden="true">
          <span className="gen-orb__ring" />
          <span className="gen-orb__ring" />
          <span className="gen-orb__ring" />
          <span className="gen-orb__core">
            <svg className="gen-orb__spark" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
              <path d="M19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" opacity="0.8" />
            </svg>
          </span>
        </div>

        <h2 className="gen-title">Seu {NOMES[tipo] || 'conteúdo'} está sendo processado</h2>
        <p className="gen-step" key={etapa}>{etapas[etapa]}</p>

        <div className="gen-bar" aria-hidden="true" />
        <p className="gen-note">Isso pode levar alguns segundos. Não feche esta página.</p>
      </div>
    </div>
  );
}
