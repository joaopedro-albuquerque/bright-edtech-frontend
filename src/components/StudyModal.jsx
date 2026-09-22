import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '../pages/FlashcardsQuizzesPage.css';
import { API_BASE } from '../config';

const Icon = {
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  spinner: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fq-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rotate: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8a6 6 0 1 0 1.2-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 4v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  flashcard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 8.5h5M4 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5" y="2" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  ),
  quiz: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 7.8a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2-2.3 3.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  ),
};

async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens.idToken.toString();
  return { token };
}

async function getDbUserId(token) {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const profile = await res.json();
  return profile.id;
}

/**
 * Modal de estudo reutilizável para flashcards (flip + avaliação SM-2) e
 * quizzes (responder + resultado final com detalhe por questão).
 * Usado tanto na Revisão Geral quanto no Document Hub.
 */
export default function StudyModal({ item, tipo, onClose }) {
  const isFlashcard = tipo === 'flashcard';

  const [cards,          setCards]          = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState('');
  const [cardIndex,      setCardIndex]      = useState(0);
  const [flipped,        setFlipped]        = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // opção marcada, ainda não verificada
  const [answersMap,     setAnswersMap]     = useState({}); // { [cardIndex]: alternativaEscolhidaIndex } — já verificadas
  const [showSummary,    setShowSummary]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const { token } = await getAuthHeaders();
        const id = await getDbUserId(token);
        const headers = { Authorization: `Bearer ${token}`, 'X-User-Id': id };
        const endpoint = isFlashcard
          ? `${API_BASE}/flashcards/${item.id}/conteudo`
          : `${API_BASE}/quizzes/${item.id}/conteudo`;
        const res = await fetch(endpoint, { headers });
        if (!res.ok) throw new Error(`Erro ${res.status} ao carregar conteúdo.`);
        const data = await res.json();
        if (!cancelled) {
          setCards(isFlashcard ? (data.cartoes || []) : (data.questoes || []));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [item.id, isFlashcard]);

  const currentCard = cards[cardIndex];
  const verifiedIndex = answersMap[cardIndex]; // undefined = ainda não verificada nesta questão
  const isVerified = verifiedIndex !== undefined;

  const nextCard = () => { setCardIndex(i => i + 1); setFlipped(false); setSelectedOption(null); };
  const prevCard = () => { setCardIndex(i => i - 1); setFlipped(false); setSelectedOption(null); };

  const avaliarCartao = async (qualidade) => {
    try {
      const { token } = await getAuthHeaders();
      const id = await getDbUserId(token);
      await fetch(`${API_BASE}/revisoes/cartoes/${currentCard.id}/avaliar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualidade }),
      });
    } catch {
      // Falha silenciosa: nao deve travar o estudo.
    }
    if (cardIndex < cards.length - 1) nextCard(); else onClose();
  };

  /* ── Marca a alternativa escolhida (ainda não confirma nem revela cor) ── */
  const selectOption = (index) => {
    if (isVerified) return;
    setSelectedOption(index);
  };

  /* ── Confirma a resposta marcada: revela certo/errado e avalia (SM-2) ── */
  const verifyAnswer = async () => {
    if (selectedOption === null || isVerified) return;
    const index = selectedOption;
    setAnswersMap(prev => ({ ...prev, [cardIndex]: index }));

    const alt = currentCard.conteudo?.alternativas?.[index];
    const correto = alt === currentCard.conteudo?.resposta_correta;
    try {
      const { token } = await getAuthHeaders();
      const id = await getDbUserId(token);
      await fetch(`${API_BASE}/revisoes/questoes/${currentCard.id}/avaliar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualidade: correto ? 5 : 2 }),
      });
    } catch {
      // Falha silenciosa: a nota de SM-2 nao deve travar o quiz.
    }
  };

  const quizAcertos = cards.reduce((total, card, i) => {
    const escolhida = answersMap[i];
    if (escolhida === undefined) return total;
    const correta = card.conteudo?.alternativas?.[escolhida] === card.conteudo?.resposta_correta;
    return correta ? total + 1 : total;
  }, 0);

  return (
    <div className="fq-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="fq-modal fq-modal--study" onClick={e => e.stopPropagation()}>
        {showSummary ? (
          <>
            <div className="fq-modal__header">
              <div className="fq-modal__header-icon">{Icon.quiz}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="fq-modal__title" style={{ fontSize: '0.95rem' }}>{item.titulo}</h2>
                <p className="fq-modal__subtitle">Resultado do quiz</p>
              </div>
              <button className="fq-modal__close" onClick={onClose} aria-label="Fechar">{Icon.close}</button>
            </div>
            <div className="fq-study__body fq-quiz-summary">
              <p className="fq-quiz-summary__score">
                Você acertou <strong>{quizAcertos}</strong> de <strong>{cards.length}</strong> questões
              </p>
              <ul className="fq-quiz-summary__list">
                {cards.map((card, i) => {
                  const escolhidaIdx = answersMap[i];
                  const escolhida = escolhidaIdx !== undefined ? card.conteudo?.alternativas?.[escolhidaIdx] : null;
                  const correta = card.conteudo?.resposta_correta;
                  const acertou = escolhida === correta;
                  return (
                    <li key={card.id} className={`fq-quiz-summary__item${acertou ? ' fq-quiz-summary__item--correct' : ' fq-quiz-summary__item--wrong'}`}>
                      <span className="fq-quiz-summary__badge">{acertou ? '✓' : '✗'}</span>
                      <div>
                        <p className="fq-quiz-summary__question">{i + 1}. {card.conteudo?.pergunta}</p>
                        {!acertou && (
                          <p className="fq-quiz-summary__answer">
                            Sua resposta: {escolhida ?? '(não respondida)'} — Correta: <strong>{correta}</strong>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="fq-study__nav">
              <button className="fq-btn fq-btn--primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="fq-modal__header">
              <div className="fq-modal__header-icon">{isFlashcard ? Icon.flashcard : Icon.quiz}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="fq-modal__title" style={{ fontSize: '0.95rem' }}>{item.titulo}</h2>
                <p className="fq-modal__subtitle">
                  {isLoading ? 'Carregando...' : error ? 'Erro ao carregar' : cards.length === 0 ? 'Nenhum card disponível' : `${cardIndex + 1} de ${cards.length}`}
                </p>
              </div>
              <button className="fq-modal__close" onClick={onClose} aria-label="Fechar">{Icon.close}</button>
            </div>

            <div className="fq-study__body">
              {isLoading ? (
                <div className="fq-modal__loading">{Icon.spinner} Carregando conteúdo...</div>
              ) : error ? (
                <div className="fq-modal__empty" style={{ padding: '2rem 0', color: '#c53030' }}>{error}</div>
              ) : cards.length === 0 ? (
                <div className="fq-modal__empty" style={{ padding: '3rem 0' }}>Nenhum card encontrado neste conjunto.</div>
              ) : isFlashcard ? (
                <div
                  className={`fq-flashcard${flipped ? ' fq-flashcard--flipped' : ''}`}
                  onClick={() => setFlipped(f => !f)}
                  title="Clique para virar"
                >
                  <div className="fq-flashcard__inner">
                    <div className="fq-flashcard__front">
                      <span className="fq-flashcard__label">Pergunta</span>
                      <p className="fq-flashcard__text">{currentCard.conteudo?.pergunta}</p>
                    </div>
                    <div className="fq-flashcard__back">
                      <span className="fq-flashcard__label">Resposta</span>
                      <p className="fq-flashcard__text">{currentCard.conteudo?.resposta}</p>
                    </div>
                  </div>
                  <p className="fq-flashcard__hint">{flipped ? 'Clique para ver a pergunta' : 'Clique para ver a resposta'}</p>
                </div>
              ) : (
                <div className="fq-quiz">
                  <p className="fq-quiz__question">{currentCard.conteudo?.pergunta}</p>
                  <ul className="fq-quiz__options">
                    {(currentCard.conteudo?.alternativas || []).map((alt, i) => {
                      const isCorrect = alt === currentCard.conteudo?.resposta_correta;
                      let cls = 'fq-quiz__option';
                      if (isVerified) {
                        if (isCorrect)             cls += ' fq-quiz__option--correct';
                        else if (i === verifiedIndex) cls += ' fq-quiz__option--wrong';
                      } else if (i === selectedOption) {
                        cls += ' fq-quiz__option--selected';
                      }
                      return (
                        <li key={i}>
                          <button className={cls} onClick={() => selectOption(i)} disabled={isVerified}>
                            <span className="fq-quiz__letter">{String.fromCharCode(65 + i)}</span>
                            {alt}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {!isVerified && (
                    <button
                      className="fq-btn fq-btn--primary fq-quiz__verify-btn"
                      onClick={verifyAnswer}
                      disabled={selectedOption === null}
                    >
                      Verificar resposta
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isLoading && !error && cards.length > 0 && (
              <div className="fq-study__nav">
                <button className="fq-btn fq-btn--ghost" onClick={prevCard} disabled={cardIndex === 0}>
                  {Icon.arrowLeft} Anterior
                </button>
                {isFlashcard && (
                  <button className="fq-btn fq-btn--ghost" onClick={() => setFlipped(f => !f)}>
                    {Icon.rotate} Virar
                  </button>
                )}
                {isFlashcard && flipped ? (
                  <div className="fq-rate-bar">
                    <button className="fq-rate-btn fq-rate-btn--again" onClick={() => avaliarCartao(1)}>Errei</button>
                    <button className="fq-rate-btn fq-rate-btn--hard"  onClick={() => avaliarCartao(3)}>Difícil</button>
                    <button className="fq-rate-btn fq-rate-btn--good"  onClick={() => avaliarCartao(4)}>Bom</button>
                    <button className="fq-rate-btn fq-rate-btn--easy"  onClick={() => avaliarCartao(5)}>Fácil</button>
                  </div>
                ) : (
                  <button
                    className="fq-btn fq-btn--primary"
                    onClick={() => {
                      if (cardIndex < cards.length - 1) nextCard();
                      else if (isFlashcard) onClose();
                      else setShowSummary(true);
                    }}
                    disabled={!isFlashcard && !isVerified}
                  >
                    {cardIndex < cards.length - 1 ? <>Próximo {Icon.arrowRight}</> : 'Concluir'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
