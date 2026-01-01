import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { peerManager, ControllerIdentify, GameSyncState } from '@/lib/peerLogic';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';

const HostGameSetup: React.FC = () => {
    const navigate = useNavigate();
    const [hostId, setHostId] = useState<string>('');
    const [connectionCount, setConnectionCount] = useState(0);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initialize Host
    useEffect(() => {
        let cleanupFunctions: Array<() => void> = [];

        const initHost = async () => {
            try {
                const id = await peerManager.initialize();
                setHostId(id);
                setIsInitializing(false);
                setConnectionCount(peerManager.getConnectionCount());

                // Sync connection count
                const unsubsCount = peerManager.onConnectionCountChange((count) => {
                    setConnectionCount(count);
                });
                cleanupFunctions.push(unsubsCount);

                // Listen for new connections to attach IDENTIFY logic
                const unsubsConn = peerManager.onConnection((conn) => {
                    // Raw connection count is handled by the manager now

                    const handleData = (data: any) => {
                        if (data?.type !== 'IDENTIFY') return;

                        const { controllerId, requestedTeamColor } = data.payload as ControllerIdentify;

                        const team = peerManager.registerOrUpdateController({
                            controllerId,
                            peerId: conn.peer,
                            requestedTeamColor,
                            connection: conn,
                        });

                        // If registration failed (limit reached), send rejection and close connection
                        if (team === null) {
                            conn.send({
                                type: 'CONNECTION_REJECTED',
                                payload: { reason: 'Game is full. Maximum 2 controllers allowed.' }
                            });
                            console.log('[host/setup] rejected controller - game full', conn.peer);
                            setTimeout(() => conn.close(), 100);
                            return;
                        }

                        // "Setup-safe" state: shows team name, but does NOT show Start Turn
                        const setupState: GameSyncState = {
                            currentCard: null,
                            currentWordIndex: 0,
                            timerActive: false,
                            timeLeft: 0,
                            teamColor: team,
                            teamName: team === 'blue' ? 'Blue Team' : 'Red Team',
                            isPaused: false,
                            activeTeamColor: 'blue',
                            connectionCount: peerManager.getConnectionCount(),
                            canStartTurn: false,
                            gamePhase: 'turnEnd',
                            currentTurnCorrectWords: [],
                            isMultiplayer: peerManager.isMultiplayer(),
                        };

                        conn.send({ type: 'SYNC_STATE', payload: setupState });
                        console.log('[host/setup] sent initial SYNC_STATE to', conn.peer, setupState);
                    };

                    conn.on('data', handleData);
                    // No easy way to remove individual 'data' listeners from PeerJS conn without the function ref,
                    // but since this is setup screen and we'll navigate away soon, it's mostly okay.
                });
                cleanupFunctions.push(unsubsConn);

            } catch (err) {
                console.error("Failed to init host", err);
                setIsInitializing(false);
            }
        };

        initHost();

        return () => {
            cleanupFunctions.forEach(fn => fn());
        };
    }, []);

    const startGame = () => {
        navigate(`/game/${hostId}`);
    };

    const controllerUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/controller/${hostId}`;

    return (
        <>
            <Header showHomeButton={false} />
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 pt-24">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                    {/* Left Side: Instructions */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">Remote Setup</h1>
                            <p className="text-muted-foreground text-lg">
                                Control the game using your phone while the board stays on this screen.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-sm">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Smartphone className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold">1. Scan QR Code</h3>
                                    <p className="text-sm text-muted-foreground">Using your mobile camera</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-sm">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Monitor className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold">2. Start Game</h3>
                                    <p className="text-sm text-muted-foreground">Once connected, click Start</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-14 text-lg mt-8"
                            onClick={startGame}
                            disabled={connectionCount === 0}
                        >
                            {connectionCount > 0 ? `Start Game (${connectionCount} Connected)` : 'Waiting for connection...'}
                        </Button>

                        {/* Disabling Play without remote (Local Mode) */}
                        {/* <div className="text-center">
                        <Button variant="link" onClick={() => navigate('/setup')} className="text-muted-foreground">
                            Play without remote (Local Mode)
                        </Button>
                    </div> */}

                    </div>

                    {/* Right Side: QR Card */}
                    <div className="flex justify-center">
                        <Card className="w-full max-w-sm aspect-square flex items-center justify-center p-6 relative overflow-hidden">
                            {isInitializing ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="bg-white p-4 rounded-xl shadow-inner">
                                        <QRCode
                                            value={controllerUrl}
                                            size={256}
                                            level={"H"}
                                            includeMargin={true}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-mono text-muted-foreground mb-1">ID: {hostId}</p>
                                        <p className="text-sm font-medium animate-pulse text-primary">
                                            {connectionCount > 0 ? 'Device Connected!' : 'Scanning...'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </Card>
                    </div>

                </div>
            </div>
        </>
    );
};

export default HostGameSetup;
