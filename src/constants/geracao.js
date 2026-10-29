export const NIVEIS_CONHECIMENTO = [
  { value: 2, label: 'Iniciante',     description: 'Linguagem simples, com conceitos explicados desde o básico.' },
  { value: 5, label: 'Intermediário', description: 'Assume uma base do assunto e foca nos pontos principais.' },
  { value: 8, label: 'Avançado',      description: 'Mais técnico e denso, sem explicar o que você já domina.' },
];

export const NIVEL_PADRAO = 5;

export const QUANTIDADES = [5, 10, 15];

export const QUANTIDADE_PADRAO = 10;

export const AVALIACOES_FLASHCARD = [
  { qualidade: 1, label: 'Não lembrei',  modifier: 'again' },
  { qualidade: 2, label: 'Muito difícil', modifier: 'hard' },
  { qualidade: 3, label: 'Difícil',       modifier: 'medium' },
  { qualidade: 4, label: 'Bom',           modifier: 'good' },
  { qualidade: 5, label: 'Fácil',         modifier: 'easy' },
];
