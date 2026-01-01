import { DataConnection, Peer } from 'peerjs';
import { Card } from './gameLogic';

// Maximum number of controllers allowed per game session
const MAX_CONTROLLERS = 2;

export interface ControllerIdentify {
    controllerId: string;
    requestedTeamColor?: 'blue' | 'red';
}

export type PeerMessage =
    | { type: 'SYNC_STATE'; payload: GameSyncState }
    | { type: 'ACTION'; payload: GameAction }
    | { type: 'IDENTIFY'; payload: ControllerIdentify }
    | { type: 'CONNECTION_REJECTED'; payload: { reason: string } }
    | { type: 'PING' }
    | { type: 'PONG' };

export interface GameSyncState {
    currentCard: Card | null;
    currentWordIndex: number;
    timerActive: boolean;
    timeLeft: number;
    teamColor: 'blue' | 'red';
    teamName: string;
    isPaused: boolean;
    activeTeamColor: 'blue' | 'red';
    connectionCount: number;
    canStartTurn: boolean;
    gamePhase: 'playing' | 'turnActive' | 'turnEnd' | 'specialTurn' | 'winner';
    currentTurnCorrectWords: Array<{ word: string; number: number }>;
    isMultiplayer: boolean;
    // Special turn fields
    specialTurnCard?: Card | null;
    specialTurnCardIndex?: number;
    specialTurnTeamPosition?: number;
}

export type GameAction =
    | { type: 'CORRECT' }
    | { type: 'SKIP' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'WRONG' }
    | { type: 'START_TURN' }
    | { type: 'SPECIAL_TEAM_GUESSED' }
    | { type: 'SPECIAL_OPPONENT_GUESSED' };

export interface ControllerConnection {
    controllerId: string;
    peerId: string;
    teamColor: 'blue' | 'red';
    connection: DataConnection;
    lastSeen: number;
}

export class GameConnectionManager {
    private controllerTeamById: Map<string, 'blue' | 'red'> = new Map();
    private peer: Peer | null = null;
    private connections: DataConnection[] = [];
    private controllerConnections: ControllerConnection[] = [];
    public myId: string = '';
    private connectionCallbacks: Set<(conn: DataConnection) => void> = new Set();
    private countChangeListeners: Set<(count: number) => void> = new Set();
    private heartbeatInterval: any = null;
    private matchedTeams: Set<'blue' | 'red'> = new Set();
    private hostId: string | null = null;

    constructor() { }

    async initialize(id?: string): Promise<string> {
        // If already initialized with the correct ID (or we don't care about the ID), just return it
        if (this.peer && !this.peer.destroyed) {
            if (!id || this.myId === id) {
                return this.myId;
            }
            // ID changed, so we must destroy the old peer
            this.destroy();
        }

        return new Promise((resolve, reject) => {
            const peerId = id || Math.random().toString(36).substring(2, 9);
            console.log('[peer] initializing with ID:', peerId);

            this.peer = new Peer(peerId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('[peer] open. My peer ID is: ' + id);
                this.myId = id;
                this.hostId = id;
                this.loadState(id);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                console.log('[peer] raw connection from:', conn.peer);
                this.connections.push(conn);

                // Important: Notify all registered callbacks
                this.connectionCallbacks.forEach(cb => cb(conn));

                conn.on('data', (data: any) => {
                    // Update lastSeen for this specific connection if it's a registered controller
                    const ctrl = this.controllerConnections.find(c => c.connection === conn);
                    if (ctrl) {
                        ctrl.lastSeen = Date.now();
                        // Also record team for sticky multiplayer
                        if (!this.matchedTeams.has(ctrl.teamColor)) {
                            this.matchedTeams.add(ctrl.teamColor);
                            this.saveState();
                        }
                    }
                });

                conn.on('open', () => {
                    console.log('[host] connected peer opened:', conn.peer);
                });

                conn.on('close', () => {
                    console.log('[host] connection closed:', conn.peer);
                    this.connections = this.connections.filter(c => c !== conn);
                    this.controllerConnections = this.controllerConnections.filter(c => c.connection !== conn);
                    // Notify about count change
                    this.notifyCountChange();
                });

                conn.on('error', (err) => {
                    console.error('[host] conn error:', err);
                });
            });

            this.peer.on('error', (err) => {
                console.error('[peer] global error', err);
                if (err.type === 'unavailable-id') {
                    // This can happen on hot-reload if the old connection is still lingering on the server
                    console.warn('[peer] ID already taken, might be a hot-reload lingering connection');
                }
                reject(err);
            });

            this.peer.on('disconnected', () => {
                console.log('[peer] disconnected from server. attempting reconnect...');
                this.peer?.reconnect();
            });

            // Start Ghost Detection Heartbeat
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = setInterval(() => {
                this.broadcast({ type: 'PING' });
                this.cleanupStaleConnections();
            }, 2000); // More aggressive heartbeat
        });
    }

    private cleanupStaleConnections() {
        const now = Date.now();
        const threshold = 5000; // 5 seconds timeout

        const beforeCount = this.controllerConnections.length;
        this.controllerConnections = this.controllerConnections.filter(c => {
            const isStale = (now - c.lastSeen) > threshold;
            const isActuallyClosed = !c.connection.open;

            if (isStale || isActuallyClosed) {
                console.log('[host] pruning stale controller:', c.controllerId, { isStale, isActuallyClosed });
                c.connection.close();
                return false;
            }
            return true;
        });

        if (this.controllerConnections.length !== beforeCount) {
            this.notifyCountChange();
        }
    }

    onConnectionCountChange(cb: (count: number) => void) {
        this.countChangeListeners.add(cb);
        return () => this.countChangeListeners.delete(cb);
    }

    private notifyCountChange() {
        const count = this.getConnectionCount();
        this.countChangeListeners.forEach(cb => cb(count));
        this.saveState();
    }

    onConnection(callback: (conn: DataConnection) => void) {
        this.connectionCallbacks.add(callback);
        return () => {
            this.connectionCallbacks.delete(callback);
        };
    }

    private pickBalancedTeam(): 'blue' | 'red' {
        let blue = 0;
        let red = 0;
        this.controllerTeamById.forEach(t => {
            if (t === 'blue') blue++;
            if (t === 'red') red++;
        });
        return blue <= red ? 'blue' : 'red';
    }

    registerOrUpdateController(args: {
        controllerId: string;
        peerId: string;
        requestedTeamColor?: 'blue' | 'red';
        connection: DataConnection;
    }): 'blue' | 'red' | null {
        const { controllerId, peerId, requestedTeamColor, connection } = args;

        // Proactively remove ghosts before checking limit
        this.cleanupStaleConnections();

        // Check if this is an existing controller reconnecting
        const existing = this.controllerConnections.find(c => c.controllerId === controllerId);

        // Filter out closed connections to get the actual "active" count
        const activeConnections = this.controllerConnections.filter(c => c.connection.open);

        // If it's a new controller and we're at the limit of OPEN connections, reject
        if (!existing && activeConnections.length >= MAX_CONTROLLERS) {
            console.log('[host] controller rejected - limit reached', {
                controllerId,
                peerId,
                activeCount: activeConnections.length,
                limit: MAX_CONTROLLERS
            });
            return null;
        }

        let team = this.controllerTeamById.get(controllerId);
        if (!team) {
            team = requestedTeamColor ?? this.pickBalancedTeam();
            this.controllerTeamById.set(controllerId, team);
            this.saveState();
            console.log('[host] assigned new team to controller:', { controllerId, team });
        }

        if (existing) {
            // Update existing controller connection
            existing.peerId = peerId;
            existing.connection = connection;
            existing.teamColor = team;
            existing.lastSeen = Date.now();
        } else {
            // Add new controller
            this.controllerConnections.push({
                controllerId,
                peerId,
                connection,
                teamColor: team,
                lastSeen: Date.now(),
            });
            if (!this.matchedTeams.has(team)) {
                this.matchedTeams.add(team);
                this.saveState();
            }
        }

        console.log('[host] controller registered', { controllerId, peerId, team });
        this.notifyCountChange();
        return team;
    }

    connectToHost(hostId: string): Promise<DataConnection> {
        return new Promise((resolve, reject) => {
            if (!this.peer) {
                reject('Peer not initialized');
                return;
            }

            const conn = this.peer.connect(hostId);

            conn.on('open', () => {
                this.connections.push(conn);
                resolve(conn);
            });

            conn.on('error', (err) => {
                reject(err);
            });
        });
    }

    broadcast(message: PeerMessage) {
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    send(message: PeerMessage) {
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    destroy() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
        this.connections.forEach(c => c.close());
        this.peer?.destroy();
        this.peer = null;
        this.connections = [];
        this.controllerConnections = [];
        this.connectionCallbacks.clear();
        this.countChangeListeners.clear();
        this.myId = '';
    }

    getConnectionCount(): number {
        return this.controllerConnections.length;
    }

    isMultiplayer(): boolean {
        // Sticky check: have we ever had both teams connected?
        return this.matchedTeams.has('blue') && this.matchedTeams.has('red');
    }

    getTeamForPeer(peerId: string): 'blue' | 'red' | null {
        const controller = this.controllerConnections.find(c => c.peerId === peerId);
        return controller ? controller.teamColor : null;
    }

    getConnectionsForTeam(teamColor: 'blue' | 'red'): ControllerConnection[] {
        return this.controllerConnections.filter(c => c.teamColor === teamColor);
    }

    getAllControllerConnections(): ControllerConnection[] {
        return [...this.controllerConnections];
    }

    private saveState() {
        if (!this.hostId) return;
        const state = {
            controllerTeamById: Array.from(this.controllerTeamById.entries()),
            matchedTeams: Array.from(this.matchedTeams)
        };
        localStorage.setItem(`peer-state-${this.hostId}`, JSON.stringify(state));
    }

    private loadState(hostId: string) {
        const saved = localStorage.getItem(`peer-state-${hostId}`);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.controllerTeamById = new Map(state.controllerTeamById);
                this.matchedTeams = new Set(state.matchedTeams);
                console.log('[peer] loaded persisted state:', state);
            } catch (e) {
                console.error('[peer] failed to load state', e);
            }
        }
    }
}

export const peerManager = new GameConnectionManager();
