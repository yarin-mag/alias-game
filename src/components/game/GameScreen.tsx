import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import SpiralBoard from './SpiralBoard';
import TeamHeader from './TeamHeader';
import WordCard from './WordCard';
import Timer from './Timer';
import Hourglass from './Hourglass';
import GameControls from './GameControls';
import RulesModal from './RulesModal';
import TurnEndModal from './TurnEndModal';
import SpecialTurnPanel from './SpecialTurnPanel';
import WinnerScreen from './WinnerScreen';
import {
  GameState,
  getNextCard,
  getCardsForSpecialTurn,
  getCurrentWord,
  calculateMovement,
  applyMovement,
  checkWinner,
  saveGameState,
  playSound,
  Card,
} from '@/lib/gameLogic';
import { Language, useTranslation } from '@/lib/i18n';
import { Play, Sparkles } from 'lucide-react';

interface GameScreenProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onReset: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState, onReset }) => {
  const t = useTranslation(gameState.language);
  const isRTL = gameState.language === 'he';

  const [timeLeft, setTimeLeft] = useState(gameState.turnDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [turnCorrect, setTurnCorrect] = useState(0);
  const [turnSkipped, setTurnSkipped] = useState(0);
  const [showTurnEnd, setShowTurnEnd] = useState(false);
  const [showOpponentQuestion, setShowOpponentQuestion] = useState(true);

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const opponentTeam = gameState.teams[gameState.currentTeamIndex === 0 ? 1 : 0];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0 && !gameState.isPaused) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeEnd();
            return 0;
          }
          if (prev <= 10) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameState.isPaused, timeLeft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && gameState.phase === 'turnActive' && !gameState.isPaused) {
        e.preventDefault();
        handleCorrect();
      } else if (e.key === ' ' && gameState.phase === 'turnActive' && !gameState.isPaused) {
        e.preventDefault();
        handleSkip();
      } else if (e.key.toLowerCase() === 'p' && gameState.phase === 'turnActive') {
        e.preventDefault();
        handlePauseToggle();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setShowRules(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase, gameState.isPaused, currentCard]);

  // Save state on changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const handleStartTurn = () => {
    const card = getNextCard(gameState);
    if (card) {
      setCurrentCard(card);
      setGameState((prev) => ({
        ...prev,
        phase: 'turnActive',
        usedCardIds: [...prev.usedCardIds, card.id],
      }));
      setTimeLeft(gameState.turnDuration);
      setIsRunning(true);
      setTurnCorrect(0);
      setTurnSkipped(0);
    }
  };

  const handleCorrect = () => {
    if (!currentCard) return;
    playSound('correct');
    setTurnCorrect((prev) => prev + 1);
    
    // Get next card
    const nextCard = getNextCard(gameState);
    if (nextCard) {
      setCurrentCard(nextCard);
      setGameState((prev) => ({
        ...prev,
        usedCardIds: [...prev.usedCardIds, nextCard.id],
        lastUnresolvedWord: getCurrentWord(nextCard, currentTeam.position),
      }));
    }
  };

  const handleSkip = () => {
    if (!currentCard) return;
    playSound('skip');
    setTurnSkipped((prev) => prev + 1);
    
    // Get next card
    const nextCard = getNextCard(gameState);
    if (nextCard) {
      setCurrentCard(nextCard);
      setGameState((prev) => ({
        ...prev,
        usedCardIds: [...prev.usedCardIds, nextCard.id],
        lastUnresolvedWord: getCurrentWord(nextCard, currentTeam.position),
      }));
    }
  };

  const handleTimeEnd = useCallback(() => {
    playSound('timeEnd');
    setIsRunning(false);
    setShowTurnEnd(true);
    setShowOpponentQuestion(true);
    
    if (currentCard) {
      setGameState((prev) => ({
        ...prev,
        phase: 'turnEnd',
        lastUnresolvedWord: getCurrentWord(currentCard, currentTeam.position),
        turnResult: {
          correct: turnCorrect,
          skipped: turnSkipped,
          movement: calculateMovement(turnCorrect, turnSkipped, prev.allowNegative),
          opponentBonus: false,
        },
      }));
    }
  }, [currentCard, turnCorrect, turnSkipped, currentTeam.position]);

  const handleOpponentGuessed = (guessed: boolean) => {
    setShowOpponentQuestion(false);
    
    const movement = calculateMovement(turnCorrect, turnSkipped, gameState.allowNegative);
    
    setGameState((prev) => {
      const newTeams = [...prev.teams] as [typeof prev.teams[0], typeof prev.teams[1]];
      
      // Apply movement to current team
      newTeams[prev.currentTeamIndex] = {
        ...newTeams[prev.currentTeamIndex],
        position: applyMovement(newTeams[prev.currentTeamIndex].position, movement),
      };
      
      // Apply opponent bonus if guessed
      if (guessed) {
        const opponentIndex = prev.currentTeamIndex === 0 ? 1 : 0;
        newTeams[opponentIndex] = {
          ...newTeams[opponentIndex],
          position: applyMovement(newTeams[opponentIndex].position, 1),
        };
      }
      
      return {
        ...prev,
        teams: newTeams,
        turnResult: {
          correct: turnCorrect,
          skipped: turnSkipped,
          movement,
          opponentBonus: guessed,
        },
      };
    });
  };

  const handleNextTurn = () => {
    setShowTurnEnd(false);
    
    // Check for winner
    const winnerIndex = gameState.teams.findIndex((t) => checkWinner(t.position));
    if (winnerIndex !== -1) {
      setGameState((prev) => ({
        ...prev,
        phase: 'winner',
      }));
      return;
    }
    
    // Switch to next team
    setGameState((prev) => ({
      ...prev,
      phase: 'playing',
      currentTeamIndex: prev.currentTeamIndex === 0 ? 1 : 0,
      turnResult: null,
      lastUnresolvedWord: null,
    }));
    setCurrentCard(null);
    setTimeLeft(gameState.turnDuration);
  };

  const handlePauseToggle = () => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const handleStartSpecialTurn = () => {
    const cards = getCardsForSpecialTurn(gameState, 5);
    setGameState((prev) => ({
      ...prev,
      phase: 'specialTurn',
      specialTurnCards: cards,
      specialTurnResults: { teamPoints: 0, opponentPoints: 0 },
      usedCardIds: [...prev.usedCardIds, ...cards.map((c) => c.id)],
    }));
  };

  const handleSpecialTeamGuessed = () => {
    setGameState((prev) => ({
      ...prev,
      specialTurnResults: {
        ...prev.specialTurnResults,
        teamPoints: prev.specialTurnResults.teamPoints + 1,
      },
      currentCardIndex: prev.currentCardIndex + 1,
    }));
  };

  const handleSpecialOpponentGuessed = () => {
    setGameState((prev) => ({
      ...prev,
      specialTurnResults: {
        ...prev.specialTurnResults,
        opponentPoints: prev.specialTurnResults.opponentPoints + 1,
      },
      currentCardIndex: prev.currentCardIndex + 1,
    }));
  };

  const handleFinishSpecialTurn = () => {
    const { teamPoints, opponentPoints } = gameState.specialTurnResults;
    
    setGameState((prev) => {
      const newTeams = [...prev.teams] as [typeof prev.teams[0], typeof prev.teams[1]];
      
      // Apply movement to current team
      newTeams[prev.currentTeamIndex] = {
        ...newTeams[prev.currentTeamIndex],
        position: applyMovement(newTeams[prev.currentTeamIndex].position, teamPoints),
      };
      
      // Apply movement to opponent
      const opponentIndex = prev.currentTeamIndex === 0 ? 1 : 0;
      newTeams[opponentIndex] = {
        ...newTeams[opponentIndex],
        position: applyMovement(newTeams[opponentIndex].position, opponentPoints),
      };
      
      // Check for winner
      const winnerIndex = newTeams.findIndex((t) => checkWinner(t.position));
      
      return {
        ...prev,
        teams: newTeams,
        phase: winnerIndex !== -1 ? 'winner' : 'playing',
        currentTeamIndex: prev.currentTeamIndex === 0 ? 1 : 0,
        specialTurnCards: [],
        currentCardIndex: 0,
        specialTurnResults: { teamPoints: 0, opponentPoints: 0 },
      };
    });
  };

  // Winner screen
  if (gameState.phase === 'winner') {
    const winnerIndex = gameState.teams.findIndex((t) => checkWinner(t.position));
    const winner = gameState.teams[winnerIndex];
    return (
      <WinnerScreen
        winnerName={winner.name}
        winnerColor={winner.color}
        language={gameState.language}
        onPlayAgain={onReset}
      />
    );
  }

  return (
    <div 
      className="min-h-screen bg-background p-4 flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Team header */}
      <TeamHeader
        teams={gameState.teams}
        currentTeamIndex={gameState.currentTeamIndex}
        language={gameState.language}
      />

      {/* Main game area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-6 items-center justify-center">
        {/* Board */}
        <div className="flex-shrink-0">
          <SpiralBoard
            team1Position={gameState.teams[0].position}
            team2Position={gameState.teams[1].position}
            team1Name={gameState.teams[0].name}
            team2Name={gameState.teams[1].name}
          />
        </div>

        {/* Game controls area */}
        <div className="flex-1 flex flex-col items-center gap-6 max-w-lg">
          {/* Timer and hourglass */}
          {gameState.phase === 'turnActive' && (
            <div className="flex items-center gap-8">
              <Hourglass
                progress={timeLeft / gameState.turnDuration}
                isRunning={isRunning && !gameState.isPaused}
              />
              <Timer
                seconds={timeLeft}
                total={gameState.turnDuration}
                isRunning={isRunning}
                isPaused={gameState.isPaused}
              />
            </div>
          )}

          {/* Word card or start buttons */}
          {gameState.phase === 'playing' && (
            <motion.div
              className="flex flex-col gap-4 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleStartTurn}
                size="lg"
                className="px-8 py-6 text-xl font-display gap-2 bg-gradient-to-r from-primary to-accent"
              >
                <Play className="w-6 h-6" />
                {t('startTurn')}
              </Button>
              
              <Button
                onClick={handleStartSpecialTurn}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="w-5 h-5 text-accent" />
                {t('startSpecialTurn')}
              </Button>
            </motion.div>
          )}

          {gameState.phase === 'turnActive' && currentCard && (
            <>
              <WordCard
                card={currentCard}
                teamPosition={currentTeam.position}
                language={gameState.language}
                isHidden={isHidden}
              />
              
              <GameControls
                onCorrect={handleCorrect}
                onSkip={handleSkip}
                onPause={handlePauseToggle}
                onResume={handlePauseToggle}
                onRules={() => setShowRules(true)}
                onToggleHide={() => setIsHidden(!isHidden)}
                isPaused={gameState.isPaused}
                isHidden={isHidden}
                language={gameState.language}
              />

              {/* Score during turn */}
              <div className="flex gap-8 text-lg font-body">
                <span className="text-success">✓ {turnCorrect}</span>
                <span className="text-destructive">✗ {turnSkipped}</span>
              </div>
            </>
          )}

          {gameState.phase === 'specialTurn' && (
            <SpecialTurnPanel
              cards={gameState.specialTurnCards}
              currentCardIndex={gameState.currentCardIndex}
              teamPosition={currentTeam.position}
              teamPoints={gameState.specialTurnResults.teamPoints}
              opponentPoints={gameState.specialTurnResults.opponentPoints}
              language={gameState.language}
              onTeamGuessed={handleSpecialTeamGuessed}
              onOpponentGuessed={handleSpecialOpponentGuessed}
              onFinish={handleFinishSpecialTurn}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <RulesModal
        open={showRules}
        onClose={() => setShowRules(false)}
        language={gameState.language}
      />

      <TurnEndModal
        open={showTurnEnd}
        onClose={handleNextTurn}
        language={gameState.language}
        lastWord={gameState.lastUnresolvedWord}
        turnResult={gameState.turnResult}
        currentTeamName={currentTeam.name}
        opponentTeamName={opponentTeam.name}
        onOpponentGuessed={handleOpponentGuessed}
        showOpponentQuestion={showOpponentQuestion}
      />
    </div>
  );
};

export default GameScreen;
