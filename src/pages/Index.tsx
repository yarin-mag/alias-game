import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const { hostId } = useParams<{ hostId?: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [language, setLanguage] = useState<Language>('he');
  const [savedGameExists, setSavedGameExists] = useState(false);

  // Check for saved game on mount
  useEffect(() => {
    const saved = loadGameState(hostId);
    if (saved) {
      setSavedGameExists(true);
      setLanguage(saved.language);

      // If we have a hostId, auto-resume
      if (hostId) {
        setGameState(saved);
        setShowSetup(false);
      }
    }
  }, [hostId]);

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
    allowNegative: boolean,
    soundEnabled: boolean
  ) => {
    clearSavedGame(hostId);
    const newState = createInitialState(team1Name, team2Name, lang, turnDuration, allowNegative);
    newState.soundEnabled = soundEnabled; // Explicitly set it
    setGameState(newState);
    setShowSetup(false);
    saveGameState(newState, hostId);
  };

  const handleResume = () => {
    const saved = loadGameState(hostId);
    if (saved) {
      setGameState(saved);
      setLanguage(saved.language);
      setShowSetup(false);
    }
  };

  const handleReset = () => {
    clearSavedGame(hostId);
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
