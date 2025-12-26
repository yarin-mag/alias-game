import { DataConnection, Peer } from 'peerjs';
import { Card } from './gameLogic';

// Message Types
export type PeerMessage =
    | { type: 'SYNC_STATE'; payload: GameSyncState }
    | { type: 'ACTION'; payload: GameAction };

export interface GameSyncState {
    currentCard: Card | null;
    currentWordIndex: number;
    timerActive: boolean;
    timeLeft: number;
    teamColor: 'blue' | 'red';
    teamName: string;
    isPaused: boolean;
    // New fields for team tracking and turn control
    activeTeamColor: 'blue' | 'red';  // Which team's turn it is
    connectionCount: number;           // Number of connected controllers
    canStartTurn: boolean;            // Whether this controller can start turns
    gamePhase: 'playing' | 'turnActive' | 'turnEnd' | 'specialTurn' | 'winner';
}

export type GameAction =
    | { type: 'CORRECT' }
    | { type: 'SKIP' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'WRONG' }
    | { type: 'START_TURN' }; // New action type for turn initiation

// Controller connection management interface
export interface ControllerConnection {
    id: string;
    teamColor: 'blue' | 'red';
    connection: DataConnection;
}

// Manager Class
export class GameConnectionManager {
    private peer: Peer | null = null;
    private connections: DataConnection[] = [];
    private controllerConnections: ControllerConnection[] = []; // New: track team assignments
    public myId: string = '';

    constructor() { }

    // Initialize Peer
    async initialize(id?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Use public peerjs server (free)
            // In production, you might want your own server
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

    // Bind listener for incoming connections (Host side)
    onConnection(callback: (conn: DataConnection) => void) {
        if (!this.peer) return;
        this.peer.on('connection', (conn) => {
            this.connections.push(conn);

            conn.on('open', () => {
                console.log('Connected to: ' + conn.peer);
                
                // Assign team based on connection order (first = blue, second = red)
                const teamColor: 'blue' | 'red' = this.controllerConnections.length === 0 ? 'blue' : 'red';
                
                const controllerConnection: ControllerConnection = {
                    id: conn.peer,
                    teamColor,
                    connection: conn
                };
                
                this.controllerConnections.push(controllerConnection);
                callback(conn);
            });

            conn.on('close', () => {
                console.log('Connection closed: ' + conn.peer);
                this.connections = this.connections.filter(c => c !== conn);
                
                // Remove from controller connections and reassign teams if needed
                const removedController = this.controllerConnections.find(c => c.connection === conn);
                this.controllerConnections = this.controllerConnections.filter(c => c.connection !== conn);
                
                // Reassign teams based on remaining connections
                this.reassignTeams();
            });
        });
    }

    // Connect to a Host (Controller side)
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

    // Send message to all (Host -> Controllers)
    broadcast(message: PeerMessage) {
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    // Send message to specific (Controller -> Host)
    send(message: PeerMessage) {
        // Controller usually only has 1 connection (to Host)
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    // Cleanup
    destroy() {
        this.connections.forEach(c => c.close());
        this.peer?.destroy();
        this.peer = null;
        this.connections = [];
        this.controllerConnections = [];
    }

    // New methods for team management
    getConnectionCount(): number {
        return this.controllerConnections.length;
    }

    getTeamForConnection(connectionId: string): 'blue' | 'red' | null {
        const controller = this.controllerConnections.find(c => c.id === connectionId);
        return controller ? controller.teamColor : null;
    }

    getConnectionsForTeam(teamColor: 'blue' | 'red'): ControllerConnection[] {
        return this.controllerConnections.filter(c => c.teamColor === teamColor);
    }

    getAllControllerConnections(): ControllerConnection[] {
        return [...this.controllerConnections];
    }

    // Reassign teams when connections drop to maintain first = blue, second = red order
    private reassignTeams(): void {
        // Sort connections by some stable criteria (connection ID) to ensure deterministic assignment
        const sortedConnections = [...this.controllerConnections].sort((a, b) => a.id.localeCompare(b.id));
        
        // Reassign teams: first connection = blue, second = red
        sortedConnections.forEach((controller, index) => {
            const newTeamColor: 'blue' | 'red' = index === 0 ? 'blue' : 'red';
            controller.teamColor = newTeamColor;
        });
        
        console.log('Teams reassigned:', this.controllerConnections.map(c => ({ id: c.id, team: c.teamColor })));
    }
}

export const peerManager = new GameConnectionManager();
