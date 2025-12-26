import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { peerManager, GameSyncState } from '@/lib/peerLogic';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Check, X, Pause, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataConnection } from 'peerjs';

function getOrCreateControllerId(): string {
    const key = 'controllerId';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
  
    const created =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
    sessionStorage.setItem(key, created);
    return created;
  }
  

// Helper function to determine if the controller should show the card
const shouldShowCard = (gameState: GameSyncState): boolean => {
    // If no current card, don't show anything
    if (!gameState.currentCard) {
        return false;
    }

    // Single controller scenario - always show card during active turns
    if (gameState.connectionCount === 1) {
        return gameState.gamePhase === 'turnActive' && gameState.timerActive;
    }

    // Two controllers scenario - only show to active team
    if (gameState.connectionCount === 2) {
        return (
            gameState.gamePhase === 'turnActive' &&
            gameState.timerActive &&
            gameState.teamColor === gameState.activeTeamColor
        );
    }

    // Default case for other scenarios
    return gameState.timerActive && gameState.teamColor === gameState.activeTeamColor;
};

// Helper function to get appropriate waiting message
const getWaitingMessage = (gameState: GameSyncState | null): string => {
    if (!gameState) {
        return 'Wait for your turn to start...';
    }

    // If game is paused, the pause indicator will show separately
    if (gameState.isPaused) {
        return 'Wait for your turn to start...';
    }

    // Single controller - generic waiting message
    if (gameState.connectionCount === 1) {
        return 'Wait for your turn to start...';
    }

    // Two controllers - team-specific messages
    if (gameState.connectionCount === 2) {
        if (gameState.gamePhase === 'turnActive' && gameState.teamColor !== gameState.activeTeamColor) {
            const activeTeamName = gameState.activeTeamColor === 'blue' ? 'Blue' : 'Red';
            return `${activeTeamName} team is playing...`;
        }
    }

    return 'Wait for your turn to start...';
};

const MobileController: React.FC = () => {
    const { hostId, teamId } = useParams<{ hostId: string; teamId?: 'blue' | 'red' }>();
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [gameState, setGameState] = useState<GameSyncState | null>(null);

    // Swipe gesture state
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-30, 30]);
    // Keep card visible during swipe, only fade slightly at extremes
    const opacity = useTransform(x, [-400, -200, 0, 200, 400], [0.7, 0.9, 1, 0.9, 0.7]);

    // Background hint opacities
    const hintOpacity = useTransform(x, [-400, -50, 0, 50, 400], [0, 0.3, 0, 0.3, 0]);
    const skipHintOpacity = useTransform(x, [-400, -150, 0], [1, 0.6, 0]);
    const correctHintOpacity = useTransform(x, [0, 150, 400], [0, 0.6, 1]);
    const backgroundColor = useTransform(
        x,
        [-300, 0, 300],
        ['rgba(239, 68, 68, 0.1)', 'transparent', 'rgba(34, 197, 94, 0.1)']
    );

    // Spring animation for smooth movement
    const springConfig = { damping: 20, stiffness: 300 };
    const xSpring = useSpring(x, springConfig);

    useEffect(() => {
        if (!hostId) return;

        let cancelled = false;
        let conn: any = null;

        const init = async () => {
            try {
                await peerManager.initialize();
                if (cancelled) return;

                conn = await peerManager.connectToHost(hostId);
                const controllerId = getOrCreateControllerId();
                const requestedTeamColor = teamId;
                console.log('[controller] sending IDENTIFY', { controllerId, requestedTeamColor });

                conn.send({
                    type: 'IDENTIFY',
                    payload: { controllerId, requestedTeamColor }
                });
                if (cancelled) return;

                setStatus('connected');

                conn.on('data', (data: any) => {
                    console.log('[controller] received', data?.type, data);
                    if (data?.type === 'SYNC_STATE') {
                      setGameState(data.payload);
                    }
                  });
            } catch (err) {
                // ignore errors caused by the StrictMode "fake unmount"
                if (cancelled) return;

                console.error(err);
                setStatus('error');
            }
        };

        init();

        return () => {
            cancelled = true;
            try { conn?.close(); } catch { }
            peerManager.destroy();
        };
    }, [hostId]);


    const sendAction = (type: 'CORRECT' | 'SKIP' | 'PAUSE' | 'RESUME' | 'START_TURN') => {
        peerManager.send({ type: 'ACTION', payload: type as any });

        // Optimistic UI update for buttons
        if (navigator.vibrate) navigator.vibrate(50);
    };

    // Handle drag end - check if swipe threshold was met
    const handleDragEnd = (event: any, info: any) => {
        const threshold = 100; // Minimum distance to trigger action
        const velocity = info.velocity.x;

        // Check if dragged far enough or fast enough
        if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
            if (info.offset.x > 0 || velocity > 0) {
                // Swiped right - CORRECT
                if (gameState && shouldShowCard(gameState) && !gameState.isPaused) {
                    sendAction('CORRECT');
                    // Vibrate for feedback
                    if (navigator.vibrate) navigator.vibrate(100);
                }
            } else {
                // Swiped left - SKIP
                if (gameState && shouldShowCard(gameState) && !gameState.isPaused) {
                    sendAction('SKIP');
                    // Vibrate for feedback
                    if (navigator.vibrate) navigator.vibrate(100);
                }
            }
        }

        // Immediately reset position - stop any animations first
        x.stop();
        x.set(0);
    };

    // Reset x position when word changes - ensure it's always centered
    // Use a ref to track the previous word index to detect changes
    const prevWordIndexRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const currentWordIndex = gameState?.currentWordIndex;
        if (currentWordIndex !== undefined && currentWordIndex !== prevWordIndexRef.current) {
            // Word index changed - immediately reset to center
            // Stop any ongoing animations first
            x.stop();
            // Then immediately set to 0
            x.set(0);
            prevWordIndexRef.current = currentWordIndex;
        }
    }, [gameState?.currentWordIndex, x]);

    if (status === 'connecting') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <h2 className="text-xl font-bold">Connecting to Game...</h2>
                <p className="text-muted-foreground mt-2">Checking connection to host</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-xl font-bold text-destructive">Connection Failed</h2>
                <p className="text-muted-foreground mt-2">Could not connect to the game host. Please try scanning the QR code again.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="bg-card p-4 shadow-sm border-b flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-lg leading-none">{gameState?.teamName || 'Waiting...'}</h1>
                    <span className={`text-xs font-medium ${gameState?.teamColor === 'red' ? 'text-team-red' : 'text-team-blue'}`}>
                        Connected Controller
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 flex flex-col justify-center items-center relative overflow-hidden">

                {/* Start Turn Button - Show when controller can start turn */}
                {gameState?.gamePhase === 'playing' &&
                    gameState?.teamColor === gameState?.activeTeamColor &&
                    !gameState?.isPaused && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center w-full mb-8"
                        >
                            <Button
                                onClick={() => sendAction('START_TURN')}
                                size="lg"
                                className="px-8 py-6 text-xl font-bold bg-gradient-to-r from-primary to-accent gap-2"
                            >
                                <Play className="w-6 h-6" />
                                Start Turn
                            </Button>
                            <p className="text-muted-foreground text-sm mt-2">
                                Tap to begin your team's turn
                            </p>
                        </motion.div>
                    )}

                {/* Current Word Display with Swipe Gestures */}
                <AnimatePresence mode="wait">
                    {gameState?.currentCard && shouldShowCard(gameState) ? (
                        <div className="relative w-full flex items-center justify-center" style={{ perspective: 1000 }}>
                            {/* Background hints for swipe direction */}
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                style={{ opacity: hintOpacity }}
                            >
                                <div className="flex items-center gap-8 w-full px-8">
                                    <motion.div
                                        className="flex-1 flex items-center justify-center"
                                        style={{ opacity: skipHintOpacity }}
                                    >
                                        <X className="w-16 h-16 text-destructive" />
                                    </motion.div>
                                    <motion.div
                                        className="flex-1 flex items-center justify-center"
                                        style={{ opacity: correctHintOpacity }}
                                    >
                                        <Check className="w-16 h-16 text-success" />
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Swipeable Word Card */}
                            <motion.div
                                key={`word-${gameState.currentCard.id}-${gameState.currentWordIndex}`}
                                drag={gameState?.isPaused ? false : "x"}
                                dragConstraints={{ left: -400, right: 400 }}
                                dragElastic={0.3}
                                onDragEnd={handleDragEnd}
                                style={{
                                    x: xSpring,
                                    rotate,
                                    opacity,
                                    cursor: gameState?.isPaused ? 'default' : 'grab',
                                }}
                                dragMomentum={false}
                                whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: 0
                                }}
                                onAnimationStart={() => {
                                    // Immediately stop and reset position when new word appears
                                    // This ensures the card starts at center position
                                    x.stop();
                                    x.set(0);
                                }}
                                exit={{ scale: 1.1, opacity: 0, y: -20 }}
                                className="text-center w-full relative z-10 touch-none select-none"
                            >
                                <motion.div
                                    className="text-5xl font-black mb-2 tracking-tight text-foreground px-4 py-8 rounded-2xl"
                                    style={{ backgroundColor }}
                                >
                                    {gameState.currentCard.words[gameState.currentWordIndex]}
                                </motion.div>
                                {/* Next Word Preview (Small)
                                <div className="text-muted-foreground/40 text-sm mt-8">
                                    Next: {gameState.currentCard.words[gameState.currentWordIndex + 1] || 'Finish'}
                                </div> */}
                                {/* Swipe hint */}
                                <div className="text-muted-foreground/60 text-xs mt-4">
                                    Swipe left to skip • Swipe right for correct
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            {getWaitingMessage(gameState)}
                            {gameState?.isPaused && (
                                <div className="mt-4 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg inline-flex items-center gap-2">
                                    <Pause className="w-4 h-4" /> Game Paused
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>

            </div>

            {/* Controls Footer */}
            <div className="p-4 grid grid-cols-2 gap-4 pb-8 safe-area-bottom">
                <Button
                    variant="outline"
                    className="h-24 text-xl font-bold border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive flex-col gap-2"
                    onClick={() => sendAction('SKIP')}
                    disabled={!gameState || !shouldShowCard(gameState) || gameState.isPaused}
                >
                    <X className="w-8 h-8" />
                    SKIP
                </Button>

                <Button
                    className="h-24 text-xl font-bold bg-success hover:bg-success/90 text-success-foreground flex-col gap-2"
                    onClick={() => sendAction('CORRECT')}
                    disabled={!gameState || !shouldShowCard(gameState) || gameState.isPaused}
                >
                    <Check className="w-8 h-8" />
                    CORRECT
                </Button>
            </div>

            {/* Pause Toggle (Floating or Top) */}
            {!gameState?.isPaused ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-muted-foreground"
                    onClick={() => sendAction('PAUSE')}
                    aria-label="Pause game"
                >
                    <Pause className="w-6 h-6" />
                </Button>
            ) : (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold mb-8">PAUSED</h2>
                    <Button
                        size="lg"
                        className="h-16 w-16 rounded-full"
                        onClick={() => sendAction('RESUME')}
                        aria-label="Resume game"
                    >
                        <Play className="w-8 h-8 ml-1" />
                    </Button>
                </div>
            )}

        </div>
    );
};

export default MobileController;
