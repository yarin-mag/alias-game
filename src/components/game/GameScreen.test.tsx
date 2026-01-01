import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GameScreen from './GameScreen';
import { GameState } from '@/lib/gameLogic';
import { peerManager } from '@/lib/peerLogic';

// Mock the peerManager
vi.mock('@/lib/peerLogic', () => ({
  peerManager: {
    broadcast: vi.fn(),
    onConnection: vi.fn(),
    myId: 'test-host-id',
    getAllControllerConnections: vi.fn(() => []),
    getConnectionCount: vi.fn(() => 0),
    getTeamForConnection: vi.fn(() => 'blue'),
  },
}));

// Mock useParams to provide hostId for host mode
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ hostId: 'test-host-id' }),
  };
});

// Mock game logic functions
vi.mock('@/lib/gameLogic', async () => {
  const actual = await vi.importActual('@/lib/gameLogic');
  return {
    ...actual,
    saveGameState: vi.fn(),
    playSound: vi.fn(),
    getNextCard: vi.fn(() => ({ id: 'test-card', words: ['TEST_WORD'] })),
  };
});

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  teams: [
    { name: 'Blue Team', color: 'blue' as const, position: 0 },
    { name: 'Red Team', color: 'red' as const, position: 0 },
  ],
  currentTeamIndex: 0 as 0 | 1,
  deck: [],
  phase: 'playing' as const,
  turnDuration: 60,
  allowNegative: false,
  language: 'en' as const,
  usedCardIds: [],
  lastUnresolvedWord: null,
  turnResult: null,
  pendingMovement: null,
  isPaused: false,
  specialTurnCards: [],
  currentCardIndex: 0,
  specialTurnResults: { teamPoints: 0, opponentPoints: 0 },
  usedWords: [],
  timeLeft: 60,
  turnCorrect: 0,
  turnSkipped: 0,
  currentTurnCorrectWords: [],
  soundEnabled: true,
  currentCard: null,
  ...overrides,
});

const renderGameScreen = (gameState: GameState, setGameState = vi.fn(), onReset = vi.fn()) => {
  return render(
    <BrowserRouter>
      <GameScreen
        gameState={gameState}
        setGameState={setGameState}
        onReset={onReset}
      />
    </BrowserRouter>
  );
};

describe('GameScreen Controller-Host Communication', () => {
  let mockConnection: any;
  let mockPeerManager: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock connection
    mockConnection = {
      on: vi.fn(),
      send: vi.fn(),
      peer: 'test-controller-id'
    };

    // Mock peerManager methods
    mockPeerManager = {
      onConnection: vi.fn(),
      getAllControllerConnections: vi.fn(() => [
        { teamColor: 'blue', connection: mockConnection }
      ]),
      getConnectionCount: vi.fn(() => 1),
      getTeamForConnection: vi.fn(() => 'blue')
    };

    // Replace the mocked peerManager
    vi.mocked(peerManager.onConnection).mockImplementation(mockPeerManager.onConnection);
    vi.mocked(peerManager.getAllControllerConnections).mockImplementation(mockPeerManager.getAllControllerConnections);
    vi.mocked(peerManager.getConnectionCount).mockImplementation(mockPeerManager.getConnectionCount);
    vi.mocked(peerManager.getTeamForConnection).mockImplementation(mockPeerManager.getTeamForConnection);
  });

  it('should process START_TURN action from controller and update game state', async () => {
    const TestWrapper = () => {
      const [gameState, setGameState] = React.useState(createMockGameState({
        phase: 'playing',
        isPaused: false,
      }));

      return (
        <BrowserRouter>
          <GameScreen
            gameState={gameState}
            setGameState={setGameState}
            onReset={() => { }}
          />
        </BrowserRouter>
      );
    };

    render(<TestWrapper />);

    // Wait for component to mount and setup peer connections
    await waitFor(() => {
      expect(mockPeerManager.onConnection).toHaveBeenCalled();
    });

    // Get the connection callback that was registered
    const connectionCallback = mockPeerManager.onConnection.mock.calls[0][0];

    // Simulate a controller connecting
    connectionCallback(mockConnection);

    // Wait for connection setup
    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalledWith('data', expect.any(Function));
    });

    // Get the data handler that was registered
    const dataHandler = mockConnection.on.mock.calls.find(call => call[0] === 'data')[1];

    // Simulate START_TURN action from controller
    act(() => {
      dataHandler({
        type: 'ACTION',
        payload: 'START_TURN'
      });
    });

    // Verify that the game state transitions to turnActive
    await waitFor(() => {
      // Check that timer appears (more specific selector)
      const timerElement = screen.getByText('1:00'); // Look for specific timer format
      expect(timerElement).toBeInTheDocument();
    });
  });

  it('should synchronize state after controller actions', async () => {
    const TestWrapper = () => {
      const [gameState, setGameState] = React.useState(createMockGameState({
        phase: 'playing',
        isPaused: false,
      }));

      return (
        <BrowserRouter>
          <GameScreen
            gameState={gameState}
            setGameState={setGameState}
            onReset={() => { }}
          />
        </BrowserRouter>
      );
    };

    render(<TestWrapper />);

    // Wait for component to mount
    await waitFor(() => {
      expect(mockPeerManager.onConnection).toHaveBeenCalled();
    });

    // Simulate controller connection and START_TURN action
    const connectionCallback = mockPeerManager.onConnection.mock.calls[0][0];
    connectionCallback(mockConnection);

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalledWith('data', expect.any(Function));
    });

    const dataHandler = mockConnection.on.mock.calls.find(call => call[0] === 'data')[1];

    // Simulate START_TURN action
    act(() => {
      dataHandler({
        type: 'ACTION',
        payload: 'START_TURN'
      });
    });

    // Verify state synchronization by checking that controller receives updated state
    await waitFor(() => {
      // The component should send state updates to controllers
      expect(mockConnection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYNC_STATE',
          payload: expect.objectContaining({
            gamePhase: 'turnActive',
            timerActive: true
          })
        })
      );
    });
  });

  it('should handle multiple controller actions in sequence', async () => {
    const TestWrapper = () => {
      const [gameState, setGameState] = React.useState(createMockGameState({
        phase: 'playing',
        isPaused: false,
      }));

      return (
        <BrowserRouter>
          <GameScreen
            gameState={gameState}
            setGameState={setGameState}
            onReset={() => { }}
          />
        </BrowserRouter>
      );
    };

    render(<TestWrapper />);

    await waitFor(() => {
      expect(mockPeerManager.onConnection).toHaveBeenCalled();
    });

    const connectionCallback = mockPeerManager.onConnection.mock.calls[0][0];
    connectionCallback(mockConnection);

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalledWith('data', expect.any(Function));
    });

    const dataHandler = mockConnection.on.mock.calls.find(call => call[0] === 'data')[1];

    // Simulate sequence: START_TURN -> PAUSE -> RESUME
    act(() => {
      dataHandler({ type: 'ACTION', payload: 'START_TURN' });
    });

    await waitFor(() => {
      expect(screen.getByText('1:00')).toBeInTheDocument(); // Timer should appear
    });

    act(() => {
      dataHandler({ type: 'ACTION', payload: 'PAUSE' });
    });

    await waitFor(() => {
      expect(screen.getByText(/paused/i)).toBeInTheDocument();
    });

    act(() => {
      dataHandler({ type: 'ACTION', payload: 'RESUME' });
    });

    await waitFor(() => {
      expect(screen.queryByText(/paused/i)).not.toBeInTheDocument();
    });
  });

  it('should broadcast state updates to all connected controllers', async () => {
    // Mock multiple controllers
    const mockController1 = { teamColor: 'blue', connection: { send: vi.fn(), peer: 'controller1' } };
    const mockController2 = { teamColor: 'red', connection: { send: vi.fn(), peer: 'controller2' } };

    mockPeerManager.getAllControllerConnections.mockReturnValue([mockController1, mockController2]);
    mockPeerManager.getConnectionCount.mockReturnValue(2);

    const TestWrapper = () => {
      const [gameState, setGameState] = React.useState(createMockGameState({
        phase: 'playing',
        isPaused: false,
      }));

      return (
        <BrowserRouter>
          <GameScreen
            gameState={gameState}
            setGameState={setGameState}
            onReset={() => { }}
          />
        </BrowserRouter>
      );
    };

    render(<TestWrapper />);

    // Wait for initial state broadcast
    await waitFor(() => {
      expect(mockController1.connection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYNC_STATE',
          payload: expect.objectContaining({
            teamColor: 'blue',
            connectionCount: 2
          })
        })
      );
      expect(mockController2.connection.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYNC_STATE',
          payload: expect.objectContaining({
            teamColor: 'red',
            connectionCount: 2
          })
        })
      );
    });
  });

  it('should handle controller disconnection gracefully', async () => {
    const TestWrapper = () => {
      const [gameState, setGameState] = React.useState(createMockGameState({
        phase: 'turnActive',
        isPaused: false,
      }));

      return (
        <BrowserRouter>
          <GameScreen
            gameState={gameState}
            setGameState={setGameState}
            onReset={() => { }}
          />
        </BrowserRouter>
      );
    };

    render(<TestWrapper />);

    await waitFor(() => {
      expect(mockPeerManager.onConnection).toHaveBeenCalled();
    });

    // Simulate controller disconnection by changing connection count
    mockPeerManager.getAllControllerConnections.mockReturnValue([]);
    mockPeerManager.getConnectionCount.mockReturnValue(0);

    // Trigger a state update that would cause re-broadcast
    const connectionCallback = mockPeerManager.onConnection.mock.calls[0][0];
    connectionCallback(mockConnection);

    // Should not throw errors when no controllers are connected
    await waitFor(() => {
      expect(mockPeerManager.getAllControllerConnections).toHaveBeenCalled();
    });
  });
});