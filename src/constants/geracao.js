export const NIVEIS_CONHECIMENTO = [
  { value: 2, label: 'Iniciante',     description: 'Linguagem simples, com conceitos explicados desde o básico.' },
  { value: 5, label: 'Intermediário', description: 'Assume uma base do assunto e foca nos pontos principais.' },
  { value: 8, label: 'Avançado',      description: 'Mais técnico e denso, sem explicar o que você já domina.' },
];

export const NIVEL_PADRAO = 5;

export const QUANTIDADES = [5, 10, 15];

export const QUANTIDADE_PADRAO = 10;

export const DIFICULDADES = [
  { value: 'facil',   label: 'Fácil' },
  { value: 'medio',   label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

// Na tela 1 = mais fácil e 5 = mais difícil; a API (SM-2) usa o inverso (5 = melhor).
export const AVALIACOES_FLASHCARD = [
  { nota: 1, qualidade: 5, label: 'Fácil',         modifier: 'easy' },
  { nota: 2, qualidade: 4, label: 'Tranquilo',     modifier: 'good' },
  { nota: 3, qualidade: 3, label: 'Médio',         modifier: 'medium' },
  { nota: 4, qualidade: 2, label: 'Difícil',       modifier: 'hard' },
  { nota: 5, qualidade: 1, label: 'Não lembrei',   modifier: 'again' },
];
