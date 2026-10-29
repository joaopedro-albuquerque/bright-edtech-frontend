import { QUANTIDADES, DIFICULDADES } from '../constants/geracao';
import '../pages/DocumentsPage.css';

/** Escolha de quantidade de perguntas e dificuldade para gerar flashcards ou quiz (usa as classes dp-*). */
export default function OpcoesGeracaoItens({ tipo, quantidade, onQuantidade, dificuldade, onDificuldade, disabled = false }) {
  const nome = tipo === 'flashcards' ? 'flashcard' : 'quiz';
  return (
    <>
      <div className="dp-modal__field">
        <label className="dp-modal__label">Quantas perguntas você deseja para esse {nome}?</label>
        <div className="dp-format-options">
          {QUANTIDADES.map((q) => (
            <button
              key={q}
              type="button"
              className={`dp-format-btn${quantidade === q ? ' dp-format-btn--selected' : ''}`}
              onClick={() => onQuantidade(q)}
              disabled={disabled}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="dp-modal__field">
        <label className="dp-modal__label">Qual o nível de dificuldade?</label>
        <div className="dp-format-options">
          {DIFICULDADES.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`dp-format-btn${dificuldade === d.value ? ' dp-format-btn--selected' : ''}`}
              onClick={() => onDificuldade(d.value)}
              disabled={disabled}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
