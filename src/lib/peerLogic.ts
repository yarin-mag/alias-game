import { DataConnection, Peer } from 'peerjs';
import { Card } from './gameLogic';

export interface ControllerIdentify {
    controllerId: string;
    requestedTeamColor?: 'blue' | 'red';
}

export type PeerMessage =
    | { type: 'SYNC_STATE'; payload: GameSyncState }
    | { type: 'ACTION'; payload: GameAction }
    | { type: 'IDENTIFY'; payload: ControllerIdentify };

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
}

export type GameAction =
    | { type: 'CORRECT' }
    | { type: 'SKIP' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'WRONG' }
    | { type: 'START_TURN' };

export interface ControllerConnection {
    controllerId: string;
    peerId: string;
    teamColor: 'blue' | 'red';
    connection: DataConnection;
}

export class GameConnectionManager {
    private controllerTeamById: Map<string, 'blue' | 'red'> = new Map();
    private peer: Peer | null = null;
    private connections: DataConnection[] = [];
    private controllerConnections: ControllerConnection[] = []; 
    public myId: string = '';

    constructor() { }

    async initialize(id?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const peerId = id || Math.random().toString(36).substring(2, 9);

            this.peer = new Peer(peerId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                this.myId = id;
                resolve(id);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error', err);
                reject(err);
            });
        });
    }

    onConnection(callback: (conn: DataConnection) => void) {
        if (!this.peer) return;

        this.peer.on('connection', (conn) => {
            this.connections.push(conn);

            conn.on('open', () => {
                console.log('[host] connected peer:', conn.peer);
                callback(conn);
            });

            conn.on('close', () => {
                console.log('[host] connection closed:', conn.peer);
                this.connections = this.connections.filter(c => c !== conn);
                this.controllerConnections = this.controllerConnections.filter(c => c.connection !== conn);
            });

            conn.on('error', (err) => {
                console.error('[host] conn error:', err);
            });
        });
    }

    private pickBalancedTeam(): 'blue' | 'red' {
        const blue = this.controllerConnections.filter(c => c.teamColor === 'blue').length;
        const red = this.controllerConnections.filter(c => c.teamColor === 'red').length;
        return blue <= red ? 'blue' : 'red';
    }

    registerOrUpdateController(args: {
        controllerId: string;
        peerId: string;
        requestedTeamColor?: 'blue' | 'red';
        connection: DataConnection;
    }): 'blue' | 'red' {
        const { controllerId, peerId, requestedTeamColor, connection } = args;

        let team = this.controllerTeamById.get(controllerId);
        if (!team) {
            team = requestedTeamColor ?? this.pickBalancedTeam();
            this.controllerTeamById.set(controllerId, team);
        }
        const existing = this.controllerConnections.find(c => c.controllerId === controllerId);
        if (existing) {
            existing.peerId = peerId;
            existing.connection = connection;
            existing.teamColor = team;
        } else {
            this.controllerConnections.push({
                controllerId,
                peerId,
                connection,
                teamColor: team,
            });
        }

        console.log('[host] controller registered', { controllerId, peerId, team });
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
        this.connections.forEach(c => c.close());
        this.peer?.destroy();
        this.peer = null;
        this.connections = [];
        this.controllerConnections = [];
    }

    getConnectionCount(): number {
        return this.controllerConnections.length;
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

}

export const peerManager = new GameConnectionManager();
