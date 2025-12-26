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
  getDigitAtPosition,
  calculateMovement,
  applyMovement,
  checkWinner,
  saveGameState,
  playSound,
  isSpecialTurnPosition,
  Card,
} from '@/lib/gameLogic';
import { Language, useTranslation } from '@/lib/i18n';
import { Play, Sparkles, Smartphone, Pause } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { peerManager } from '@/lib/peerLogic';

interface GameScreenProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onReset: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState, onReset }) => {
  const { hostId } = useParams<{ hostId?: string }>();
  const isHostMode = !!hostId;

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

  const isCurrentPositionSpecial = isSpecialTurnPosition(currentTeam.position);

  useEffect(() => {
    if (!isHostMode || !hostId) return;

    const allControllers = peerManager.getAllControllerConnections();
    allControllers.forEach(controller => {
      const controllerTeamName = controller.teamColor === 'blue' ? gameState.teams[0].name : gameState.teams[1].name;

      controller.connection.send({
        type: 'SYNC_STATE',
        payload: {
          currentCard: currentCard,
          currentWordIndex: currentCard ? getDigitAtPosition(currentTeam.position) : 0,
          timerActive: isRunning,
          timeLeft: timeLeft,
          teamColor: controller.teamColor,
          teamName: controllerTeamName,
          isPaused: gameState.isPaused,
          // New fields for turn control
          activeTeamColor: currentTeam.color,
          connectionCount: peerManager.getConnectionCount(),
          canStartTurn: gameState.phase === 'playing' && !gameState.isPaused,
          gamePhase: gameState.phase === 'playing' ? 'playing' :
            gameState.phase === 'turnActive' ? 'turnActive' :
              gameState.phase === 'turnEnd' ? 'turnEnd' :
                gameState.phase === 'specialTurn' ? 'specialTurn' : 'winner'
        }
      });
    });
  }, [isHostMode, hostId, currentCard, isRunning, timeLeft, currentTeam, gameState.isPaused, gameState.phase, gameState.teams]);

  // Note: Connection handlers are set up in a separate useEffect after refs are defined
  // --------------------------

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const handlePauseToggle = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, [setGameState]);

  const handleCorrect = useCallback(() => {
    playSound('correct');
    setTurnCorrect((prev) => prev + 1);
    const nextCard = getNextCard(gameState);
    if (nextCard) {
      setCurrentCard(nextCard);
      setGameState((prev) => ({
        ...prev,
        usedCardIds: [...prev.usedCardIds, nextCard.id],
        lastUnresolvedWord: getCurrentWord(nextCard, currentTeam.position),
      }));
    }
  }, [gameState, currentTeam.position, setGameState]);

  const handleSkip = useCallback(() => {
    playSound('skip');
    setTurnSkipped((prev) => prev + 1);
    const nextCard = getNextCard(gameState);
    if (nextCard) {
      setCurrentCard(nextCard);
      setGameState((prev) => ({
        ...prev,
        usedCardIds: [...prev.usedCardIds, nextCard.id],
        lastUnresolvedWord: getCurrentWord(nextCard, currentTeam.position),
      }));
    }
  }, [gameState, currentTeam.position, setGameState]);

  const handleTimeEnd = useCallback(() => {
    playSound('timeEnd');
    setIsRunning(false);
    setShowTurnEnd(true);
    setShowOpponentQuestion(true);

    const movement = calculateMovement(turnCorrect, turnSkipped, gameState.allowNegative);

    if (currentCard) {
      setGameState((prev) => ({
        ...prev,
        phase: 'turnEnd',
        lastUnresolvedWord: getCurrentWord(currentCard, currentTeam.position),
        turnResult: {
          correct: turnCorrect,
          skipped: turnSkipped,
          movement,
          opponentBonus: false,
        },
        pendingMovement: {
          teamIndex: prev.currentTeamIndex,
          movement,
          opponentBonus: false,
        },
      }));
    }
  }, [currentCard, turnCorrect, turnSkipped, currentTeam.position, gameState.allowNegative, setGameState]);

  const handleStartTurn = useCallback(() => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') return prev;
      const card = getNextCard(prev);
      if (!card) return prev;

      setCurrentCard(card);
      setTimeLeft(prev.turnDuration);
      setIsRunning(true);
      setTurnCorrect(0);
      setTurnSkipped(0);

      return {
        ...prev,
        phase: 'turnActive',
        usedCardIds: [...prev.usedCardIds, card.id],
      };
    });
  }, [setGameState]);

  // PeerJS Action Refs (to avoid stale closures in listeners)
  const handleCorrectRef = React.useRef(handleCorrect);
  const handleSkipRef = React.useRef(handleSkip);
  const handlePauseRef = React.useRef(handlePauseToggle);
  const handleStartTurnRef = React.useRef(handleStartTurn);

  useEffect(() => {
    handleCorrectRef.current = handleCorrect;
    handleSkipRef.current = handleSkip;
    handlePauseRef.current = handlePauseToggle;
    handleStartTurnRef.current = handleStartTurn;
  }, [handleCorrect, handleSkip, handlePauseToggle, handleStartTurn]);

  // Setup connection handlers AFTER refs are defined
  useEffect(() => {
    if (!isHostMode || !hostId) return;

    // Setup data handlers for all existing connections
    const setupExistingConnections = () => {
      const allControllers = peerManager.getAllControllerConnections();
      allControllers.forEach(controller => {
        // Remove any existing data handlers to avoid duplicates
        controller.connection.off('data');

        // Attach new data handler
        controller.connection.on('data', (data: any) => {
          if (data.type === 'ACTION') {
            // Use refs to avoid stale closures
            if (data.payload === 'CORRECT') handleCorrectRef.current();
            if (data.payload === 'SKIP') handleSkipRef.current();
            if (data.payload === 'PAUSE' || data.payload === 'RESUME') handlePauseRef.current();
            if (data.payload === 'START_TURN') handleStartTurnRef.current();
          }
        });
      });
    };

    // Setup handler for new connections
    peerManager.onConnection((conn) => {
      conn.on('data', (data: any) => {
        if (data?.type === 'IDENTIFY') {
          const { controllerId, requestedTeamColor } = data.payload as {
            controllerId: string;
            requestedTeamColor?: 'blue' | 'red';
          };

          const controllerTeam = peerManager.registerOrUpdateController({
            controllerId,
            peerId: conn.peer,
            requestedTeamColor,
            connection: conn
          });

          const controllerTeamName =
            controllerTeam === 'blue' ? gameState.teams[0].name : gameState.teams[1].name;

          conn.send({
            type: 'SYNC_STATE',
            payload: {
              currentCard,
              currentWordIndex: currentCard ? getDigitAtPosition(currentTeam.position) : 0,
              timerActive: isRunning,
              timeLeft,
              teamColor: controllerTeam,
              teamName: controllerTeamName,
              isPaused: gameState.isPaused,
              activeTeamColor: currentTeam.color,
              connectionCount: peerManager.getConnectionCount(),
              canStartTurn: gameState.phase === 'playing' && !gameState.isPaused,
              gamePhase:
                gameState.phase === 'playing'
                  ? 'playing'
                  : gameState.phase === 'turnActive'
                    ? 'turnActive'
                    : gameState.phase === 'turnEnd'
                      ? 'turnEnd'
                      : gameState.phase === 'specialTurn'
                        ? 'specialTurn'
                        : 'winner'
            }
          });
          console.log('[host] sent SYNC_STATE to', conn.peer);

          return;
        }

        // 2) Game actions (ignore until IDENTIFY happened)
        if (data?.type === 'ACTION') {
          // Use refs to avoid stale closures
          if (data.payload === 'CORRECT') handleCorrectRef.current();
          if (data.payload === 'SKIP') handleSkipRef.current();
          if (data.payload === 'PAUSE' || data.payload === 'RESUME') handlePauseRef.current();
          if (data.payload === 'START_TURN') handleStartTurnRef.current();
        }
      });

    });


    setupExistingConnections();
  }, [isHostMode, hostId, gameState.teams, currentCard, isRunning, timeLeft, currentTeam, gameState.isPaused, gameState.phase]);

  const handleStartSpecialTurn = useCallback(() => {
    const cards = getCardsForSpecialTurn(gameState, 5); // Get 5 cards for special turn
    setGameState(prev => ({
      ...prev,
      phase: 'specialTurn',
      specialTurnCards: cards,
      currentCardIndex: 0,
      specialTurnResults: {
        teamPoints: 0,
        opponentPoints: 0
      }
    }));
  }, [gameState, setGameState]);

  const handleSpecialTeamGuessed = useCallback(() => {
    playSound('correct');
    setGameState(prev => ({
      ...prev,
      currentCardIndex: prev.currentCardIndex + 1,
      specialTurnResults: {
        ...prev.specialTurnResults,
        teamPoints: prev.specialTurnResults.teamPoints + 1
      }
    }));
  }, [setGameState]);

  const handleSpecialOpponentGuessed = useCallback(() => {
    playSound('skip'); // Or maybe a different sound
    setGameState(prev => ({
      ...prev,
      currentCardIndex: prev.currentCardIndex + 1,
      specialTurnResults: {
        ...prev.specialTurnResults,
        opponentPoints: prev.specialTurnResults.opponentPoints + 1
      }
    }));
  }, [setGameState]);

  const handleFinishSpecialTurn = useCallback(() => {
    // Apply points immediately for special turn
    const teamPoints = gameState.specialTurnResults.teamPoints;
    const opponentPoints = gameState.specialTurnResults.opponentPoints;

    setGameState(prev => {
      const currentTeamIdx = prev.currentTeamIndex;
      const opponentIdx = currentTeamIdx === 0 ? 1 : 0;

      let newTeams = [...prev.teams] as [typeof prev.teams[0], typeof prev.teams[1]];

      const team1Pos = applyMovement(newTeams[currentTeamIdx].position, teamPoints);
      newTeams[currentTeamIdx] = { ...newTeams[currentTeamIdx], position: team1Pos };

      const team2Pos = applyMovement(newTeams[opponentIdx].position, opponentPoints);
      newTeams[opponentIdx] = { ...newTeams[opponentIdx], position: team2Pos };

      let winner: 'blue' | 'red' | null = null;
      if (checkWinner(newTeams[0].position)) winner = newTeams[0].color; // Assumption: index 0 is first team
      else if (checkWinner(newTeams[1].position)) winner = newTeams[1].color;

      let newPhase: GameState['phase'] = prev.phase;
      if (checkWinner(newTeams[currentTeamIdx].position) || checkWinner(newTeams[opponentIdx].position)) {
        newPhase = 'winner';
      } else {
        newPhase = 'playing';
      }

      return {
        ...prev,
        teams: newTeams,
        phase: newPhase,
        currentTeamIndex: newPhase === 'winner' ? prev.currentTeamIndex : opponentIdx
      };
    });
  }, [gameState, setGameState]);

  const handleOpponentGuessed = useCallback((correct: boolean) => {
    if (correct) {
      playSound('correct');
      setGameState(prev => {
        if (!prev.pendingMovement) return prev;
        return {
          ...prev,
          turnResult: {
            ...prev.turnResult!,
            opponentBonus: true
          },
          pendingMovement: {
            ...prev.pendingMovement,
            opponentBonus: true
          }
        };
      });
    }
    setShowOpponentQuestion(false);
  }, [setGameState]);

  const handleNextTurn = useCallback(() => {
    setShowTurnEnd(false);

    setGameState(prev => {
      if (!prev.pendingMovement) return prev;

      const currentTeamIdx = prev.pendingMovement.teamIndex;
      let newTeams = [...prev.teams] as [typeof prev.teams[0], typeof prev.teams[1]];

      const newPos = applyMovement(newTeams[currentTeamIdx].position, prev.pendingMovement.movement);
      newTeams[currentTeamIdx] = { ...newTeams[currentTeamIdx], position: newPos };

      if (prev.pendingMovement.opponentBonus) {
        const opponentIdx = currentTeamIdx === 0 ? 1 : 0;
        const oppPos = applyMovement(newTeams[opponentIdx].position, 1);
        newTeams[opponentIdx] = { ...newTeams[opponentIdx], position: oppPos };
      }

      let newPhase: GameState['phase'] = 'playing';
      if (checkWinner(newTeams[0].position) || checkWinner(newTeams[1].position)) {
        newPhase = 'winner';
      }

      return {
        ...prev,
        teams: newTeams,
        phase: newPhase,
        currentTeamIndex: newPhase === 'winner' ? prev.currentTeamIndex : (currentTeamIdx === 0 ? 1 : 0) as 0 | 1,
        turnResult: null,
        pendingMovement: null
      };
    });

    setCurrentCard(null);
    setTurnCorrect(0);
    setTurnSkipped(0);
  }, [setGameState]);

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
  }, [isRunning, gameState.isPaused, timeLeft, handleTimeEnd]);

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
  }, [gameState.phase, gameState.isPaused, currentCard, handleCorrect, handleSkip, handlePauseToggle]);

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
          {/* HOST MODE INDICATOR */}
          {isHostMode && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2 mb-2 animate-pulse">
              <Smartphone className="w-5 h-5" />
              <span className="font-bold">Remote Controller Active</span>
            </div>
          )}

          {/* Timer and hourglass - visible during active turn */}
          {gameState.phase === 'turnActive' && (
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
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
            </motion.div>
          )}

          {/* Word card or start buttons */}
          {gameState.phase === 'playing' && !isHostMode && (
            <motion.div
              className="flex flex-col gap-4 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Show if this is a special turn position */}
              {isCurrentPositionSpecial ? (
                <>
                  <div className="text-center mb-2">
                    <div className="flex items-center justify-center gap-2 text-accent font-display text-xl">
                      <Sparkles className="w-6 h-6" />
                      <span>{t('specialTurnRequired')}</span>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('specialTurnDescription')}
                    </p>
                  </div>
                  <Button
                    onClick={handleStartSpecialTurn}
                    size="lg"
                    className="px-8 py-6 text-xl font-display gap-2 bg-gradient-to-r from-accent to-primary"
                  >
                    <Sparkles className="w-6 h-6" />
                    {t('startSpecialTurn')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleStartTurn}
                  size="lg"
                  className="px-8 py-6 text-xl font-display gap-2 bg-gradient-to-r from-primary to-accent"
                >
                  <Play className="w-6 h-6" />
                  {t('startTurn')}
                </Button>
              )}
            </motion.div>
          )}

          {gameState.phase === 'turnActive' && currentCard && (
            <>
              {/* In Host Mode, hide the card so only the controller sees it */}
              {!isHostMode && (
                <WordCard
                  card={currentCard}
                  teamPosition={currentTeam.position}
                  language={gameState.language}
                  isHidden={isHidden}
                />
              )}

              {!isHostMode && (
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
              )}

              {/* Host Mode Pause Controls */}
              {isHostMode && (
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-center">
                    <h3 className="text-xl font-display mb-2">
                      {currentTeam.name} {t('isPlaying')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('controllerActiveMessage')}
                    </p>
                  </div>

                  {/* Pause/Resume Button for Host */}
                  <Button
                    onClick={handlePauseToggle}
                    variant="outline"
                    className="gap-2 px-6 py-3"
                    size="lg"
                  >
                    {gameState.isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        {t('resumeGame')}
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        {t('pauseGame')}
                      </>
                    )}
                    <kbd className="ml-2 px-2 py-1 bg-muted rounded text-sm">P</kbd>
                  </Button>

                  {/* Pause Overlay for Host */}
                  {gameState.isPaused && (
                    <motion.div
                      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="bg-background p-8 rounded-lg text-center">
                        <h2 className="text-3xl font-display mb-4">{t('paused')}</h2>
                        <Button
                          onClick={handlePauseToggle}
                          size="lg"
                          className="gap-2"
                        >
                          <Play className="w-5 h-5" />
                          {t('resumeGame')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

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