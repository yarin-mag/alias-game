import React, { useState, useEffect } from 'react';
import SetupScreen from '@/components/game/SetupScreen';
import GameScreen from '@/components/game/GameScreen';
import { 
  GameState, 
  createInitialState, 
  loadGameState, 
  clearSavedGame,
  saveGameState 
} from '@/lib/gameLogic';
import { Language } from '@/lib/i18n';

const Index = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [language, setLanguage] = useState<Language>('he');
  const [savedGameExists, setSavedGameExists] = useState(false);

  // Check for saved game on mount
  useEffect(() => {
    const saved = loadGameState();
    if (saved) {
      setSavedGameExists(true);
      setLanguage(saved.language);
    }
  }, []);

  // Update HTML dir attribute based on language
  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleStart = (
    team1Name: string,
    team2Name: string,
    lang: Language,
    turnDuration: number,
    allowNegative: boolean
  ) => {
    clearSavedGame();
    const newState = createInitialState(team1Name, team2Name, lang, turnDuration, allowNegative);
    setGameState(newState);
    setShowSetup(false);
    saveGameState(newState);
  };

  const handleResume = () => {
    const saved = loadGameState();
    if (saved) {
      setGameState(saved);
      setLanguage(saved.language);
      setShowSetup(false);
    }
  };

  const handleReset = () => {
    clearSavedGame();
    setGameState(null);
    setShowSetup(true);
    setSavedGameExists(false);
  };

  if (showSetup) {
    return (
      <SetupScreen
        onStart={handleStart}
        savedGameExists={savedGameExists}
        onResume={handleResume}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  if (gameState) {
    return (
      <GameScreen
        gameState={gameState}
        setGameState={setGameState}
        onReset={handleReset}
      />
    );
  }

  return null;
};

export default Index;
