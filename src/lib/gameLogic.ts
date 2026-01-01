import { hebrewByDifficulty, englishByDifficulty, Language } from './wordBanks';

export interface Card {
  id: number;
  words: string[];
}

export interface Team {
  name: string;
  position: number; // Position on the spiral path (0 to 80)
  color: 'blue' | 'red';
}

export interface TurnResult {
  correct: number;
  skipped: number;
  movement: number;
  opponentBonus: boolean;
}

export interface GameState {
  teams: [Team, Team];
  currentTeamIndex: 0 | 1;
  deck: Card[];
  usedCardIds: number[]; // Deprecated, kept for backward compatibility if needed, but we rely on usedWords now
  usedWords: string[]; // Format: "${cardId}-${digit}"
  currentCardIndex: number;
  turnDuration: number;
  allowNegative: boolean;
  language: Language;
  phase: 'setup' | 'playing' | 'turnActive' | 'turnEnd' | 'specialTurn' | 'winner';
  turnResult: TurnResult | null;
  lastUnresolvedWord: string | null;
  specialTurnCards: Card[];
  specialTurnResults: { teamPoints: number; opponentPoints: number };
  isPaused: boolean;
  timeLeft: number;
  currentCard: Card | null;
  turnCorrect: number;
  turnSkipped: number;
  pendingMovement: { teamIndex: 0 | 1; movement: number; opponentBonus: boolean } | null;
  currentTurnCorrectWords: Array<{ word: string; number: number }>;
  soundEnabled: boolean;
}

// Special turn positions: every 7, then 6, then 5... positions
// Starting from 0: 7, 13 (7+6), 18 (13+5), 22 (18+4), 25 (22+3), 27 (25+2), 28 (27+1)
// Then repeat pattern: 35, 41, 46, 50, 53, 55, 56, 63, 69...
export const getSpecialTurnPositions = (): Set<number> => {
  const positions = new Set<number>();
  let current = 7;
  let step = 7;

  while (current <= 80) {
    positions.add(current);
    step = Math.max(1, step - 1);
    if (step === 1) step = 7; // Reset pattern
    current += step;
  }

  return positions;
};

export const SPECIAL_TURN_POSITIONS = getSpecialTurnPositions();

// Generate the spiral path for 9x9 board (81 positions)
// Starting from outer edge, spiraling inward
export const generateSpiralPath = (): { x: number; y: number; digit: number; isSpecial: boolean }[] => {
  const size = 9;
  const path: { x: number; y: number; digit: number; isSpecial: boolean }[] = [];

  let top = 0, bottom = size - 1, left = 0, right = size - 1;
  let posIndex = 0;

  while (top <= bottom && left <= right) {
    // Right along top
    for (let i = left; i <= right; i++) {
      path.push({
        x: i,
        y: top,
        digit: posIndex % 10,
        isSpecial: SPECIAL_TURN_POSITIONS.has(posIndex)
      });
      posIndex++;
    }
    top++;

    // Down along right
    for (let i = top; i <= bottom; i++) {
      path.push({
        x: right,
        y: i,
        digit: posIndex % 10,
        isSpecial: SPECIAL_TURN_POSITIONS.has(posIndex)
      });
      posIndex++;
    }
    right--;

    // Left along bottom
    if (top <= bottom) {
      for (let i = right; i >= left; i--) {
        path.push({
          x: i,
          y: bottom,
          digit: posIndex % 10,
          isSpecial: SPECIAL_TURN_POSITIONS.has(posIndex)
        });
        posIndex++;
      }
      bottom--;
    }

    // Up along left
    if (left <= right) {
      for (let i = bottom; i >= top; i--) {
        path.push({
          x: left,
          y: i,
          digit: posIndex % 10,
          isSpecial: SPECIAL_TURN_POSITIONS.has(posIndex)
        });
        posIndex++;
      }
      left++;
    }
  }

  return path;
};

// Check if position is a special turn position
export const isSpecialTurnPosition = (position: number): boolean => {
  return SPECIAL_TURN_POSITIONS.has(position);
};

// Get the digit (0-9) at a specific spiral position
export const getDigitAtPosition = (position: number): number => {
  return position % 10;
};

// Difficulty Weights defined in requirements
// Easy: 40%, Medium: 30%, Phrases: 10%, Slang: 10%, Hard: 5%, Idioms: 5%
const DIFFICULTY_WEIGHTS = [
  { type: 'easy', weight: 0.40 },
  { type: 'medium', weight: 0.30 },
  { type: 'phrases', weight: 0.10 },
  { type: 'slang', weight: 0.10 },
  { type: 'hard', weight: 0.05 },
  { type: 'idioms', weight: 0.05 },
] as const;

type DifficultyType = typeof DIFFICULTY_WEIGHTS[number]['type'];

const getRandomDifficulty = (): DifficultyType => {
  const random = Math.random();
  let acc = 0;
  for (const { type, weight } of DIFFICULTY_WEIGHTS) {
    acc += weight;
    if (random < acc) return type;
  }
  return 'easy'; // Fallback
};

// Generate deck of cards with weighted difficulty
export const generateDeck = (language: Language): Card[] => {
  const wordBanks = language === 'he' ? hebrewByDifficulty : englishByDifficulty;
  const cards: Card[] = [];
  const usedWordsInDeck = new Set<string>();

  // We desire a deck of reasonable size, e.g., 50 cards (500 words)
  // or use all available words if fewer.
  // Given duplicate prevention, we might hit limits.
  const TOTAL_CARDS = 50;
  const WORDS_PER_CARD = 10;

  for (let i = 0; i < TOTAL_CARDS; i++) {
    const cardWords: string[] = [];

    // Try to fill the card
    let attempts = 0;
    while (cardWords.length < WORDS_PER_CARD && attempts < 100) { // Limit attempts to prevent infinite loop
      attempts++;

      const difficulty = getRandomDifficulty();
      // @ts-ignore - Typescript might complain about specific keys but we know they match
      const pool = wordBanks[difficulty];

      if (!pool || pool.length === 0) continue;

      const randomWord = pool[Math.floor(Math.random() * pool.length)];

      if (!usedWordsInDeck.has(randomWord) && !cardWords.includes(randomWord)) {
        cardWords.push(randomWord);
        usedWordsInDeck.add(randomWord);
      }
    }

    // If we couldn't fill the card fully (ran out of unique words?), fill with any available unique words from 'all'
    if (cardWords.length < WORDS_PER_CARD) {
      const allWords = wordBanks.all;
      const shuffledAll = [...allWords].sort(() => Math.random() - 0.5);
      for (const word of shuffledAll) {
        if (cardWords.length >= WORDS_PER_CARD) break;
        if (!usedWordsInDeck.has(word) && !cardWords.includes(word)) {
          cardWords.push(word);
          usedWordsInDeck.add(word);
        }
      }
    }

    // Only add card if it is full (or mostly full if we really ran out of words)
    if (cardWords.length === WORDS_PER_CARD) {
      cards.push({
        id: i,
        words: cardWords
      });
    }
  }

  // Shuffle cards
  return cards.sort(() => Math.random() - 0.5);
};

// Get the current word for the active team based on their position
export const getCurrentWord = (card: Card, position: number): string => {
  const digit = getDigitAtPosition(position);
  return card.words[digit];
};

// Calculate movement for a normal turn
export const calculateMovement = (correct: number, skipped: number, allowNegative: boolean): number => {
  const movement = correct - skipped;
  return allowNegative ? movement : Math.max(0, movement);
};

// Apply movement to team position
export const applyMovement = (currentPosition: number, movement: number): number => {
  const newPosition = currentPosition + movement;
  // Clamp between 0 and 80 (center of spiral)
  return Math.max(0, Math.min(80, newPosition));
};

// Check for winner
export const checkWinner = (position: number): boolean => {
  return position >= 80;
};

// Create initial game state
export const createInitialState = (
  team1Name: string,
  team2Name: string,
  language: Language,
  turnDuration: number,
  allowNegative: boolean
): GameState => {
  return {
    teams: [
      { name: team1Name, position: 0, color: 'blue' },
      { name: team2Name, position: 0, color: 'red' },
    ],
    currentTeamIndex: 0,
    deck: generateDeck(language),
    usedCardIds: [],
    usedWords: [],
    currentCardIndex: 0,
    turnDuration,
    allowNegative,
    language,
    phase: 'playing',
    turnResult: null,
    lastUnresolvedWord: null,
    specialTurnCards: [],
    timeLeft: turnDuration,
    isPaused: false,
    currentCard: null,
    turnCorrect: 0,
    turnSkipped: 0,
    specialTurnResults: { teamPoints: 0, opponentPoints: 0 },
    pendingMovement: null,
    currentTurnCorrectWords: [],
    soundEnabled: true,
  };
};

// LocalStorage key
const STORAGE_KEY = 'alias-game-state';

// LocalStorage key helper
const getStorageKey = (hostId?: string): string => {
  return hostId ? `${STORAGE_KEY}-${hostId}` : STORAGE_KEY;
};

// Save game state
export const saveGameState = (state: GameState, hostId?: string): void => {
  localStorage.setItem(getStorageKey(hostId), JSON.stringify(state));
};

// Load game state
export const loadGameState = (hostId?: string): GameState | null => {
  const saved = localStorage.getItem(getStorageKey(hostId));
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Clear saved game
export const clearSavedGame = (hostId?: string): void => {
  localStorage.removeItem(getStorageKey(hostId));
};

// Get available card based on current digit position
export const getNextCard = (state: GameState, digit: number): Card | null => {
  // Find a card where this specific word index hasn't been used yet
  // We prioritize cards that have been used least? No, random is fine.
  // We need to iterate through the deck and find one where cardId-digit is not in usedWords.

  // First, verify usedWords exists (migration safety)
  const usedWords = state.usedWords || [];

  const availableCards = state.deck.filter(card => !usedWords.includes(`${card.id}-${digit}`));

  if (availableCards.length === 0) {
    // If all words at this digit are used, we must reuse.
    // Pick a random card from the deck.
    return state.deck[Math.floor(Math.random() * state.deck.length)];
  }

  // Return a random available card to keep it unpredictable
  // (Though deck is already shuffled, picking [0] is fine, but random is safer if deck order is static)
  return availableCards[Math.floor(Math.random() * availableCards.length)];
};

// Get multiple cards for special turn
export const getCardsForSpecialTurn = (state: GameState, count: number, digit: number): Card[] => {
  const usedWords = state.usedWords || [];
  const availableCards = state.deck.filter(card => !usedWords.includes(`${card.id}-${digit}`));

  // If we have enough available cards, use them
  if (availableCards.length >= count) {
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // If not enough available, take all remaining available and fill the rest with random cards from the deck
  const picked = [...availableCards];
  const remainingCount = count - picked.length;

  // Get other cards that are NOT in picked yet (to avoid picking same card twice in one special turn if possible)
  const otherCards = state.deck.filter(card => !picked.includes(card));
  const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);

  for (let i = 0; i < remainingCount; i++) {
    if (i < shuffledOthers.length) {
      picked.push(shuffledOthers[i]);
    } else {
      // If we somehow ran out of distinct cards, reuse any
      picked.push(state.deck[Math.floor(Math.random() * state.deck.length)]);
    }
  }

  return picked;
};

// Sound URLs (using Web Audio API for simple sounds)
export const playSound = (type: 'tick' | 'timeEnd' | 'correct' | 'skip', enabled: boolean = true): void => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  switch (type) {
    case 'tick':
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
      break;
    case 'timeEnd':
      oscillator.frequency.value = 440;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
      break;
    case 'correct':
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.2;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
    case 'skip':
      oscillator.frequency.value = 300;
      gainNode.gain.value = 0.15;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
  }
};