import { getWordBank, Language } from './wordBanks';

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
  usedCardIds: number[];
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
  pendingMovement: { teamIndex: 0 | 1; movement: number; opponentBonus: boolean } | null;
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

// Generate deck of cards
export const generateDeck = (language: Language): Card[] => {
  const words = getWordBank(language);
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const cards: Card[] = [];
  
  // Create cards with 10 words each
  for (let i = 0; i < Math.floor(shuffled.length / 10); i++) {
    cards.push({
      id: i,
      words: shuffled.slice(i * 10, (i + 1) * 10),
    });
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
    currentCardIndex: 0,
    turnDuration,
    allowNegative,
    language,
    phase: 'playing',
    turnResult: null,
    lastUnresolvedWord: null,
    specialTurnCards: [],
    specialTurnResults: { teamPoints: 0, opponentPoints: 0 },
    isPaused: false,
    pendingMovement: null,
  };
};

// LocalStorage key
const STORAGE_KEY = 'alias-game-state';

// Save game state
export const saveGameState = (state: GameState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Load game state
export const loadGameState = (): GameState | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
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
export const clearSavedGame = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Get available card (not used yet)
export const getNextCard = (state: GameState): Card | null => {
  const availableCards = state.deck.filter(card => !state.usedCardIds.includes(card.id));
  if (availableCards.length === 0) {
    // Reshuffle if all cards used
    return state.deck[Math.floor(Math.random() * state.deck.length)];
  }
  return availableCards[0];
};

// Get multiple cards for special turn
export const getCardsForSpecialTurn = (state: GameState, count: number): Card[] => {
  const availableCards = state.deck.filter(card => !state.usedCardIds.includes(card.id));
  const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Sound URLs (using Web Audio API for simple sounds)
export const playSound = (type: 'tick' | 'timeEnd' | 'correct' | 'skip'): void => {
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