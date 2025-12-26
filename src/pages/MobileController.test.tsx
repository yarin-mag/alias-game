import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MobileController from './MobileController';
import { peerManager } from '@/lib/peerLogic';

// Mock the peerManager
vi.mock('@/lib/peerLogic', () => ({
  peerManager: {
    initialize: vi.fn(),
    connectToHost: vi.fn(),
    send: vi.fn(),
    destroy: vi.fn(),
  },
}));

// Mock useParams to provide hostId
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ hostId: 'test-host-id' }),
  };
});

const renderMobileController = () => {
  return render(
    <BrowserRouter>
      <MobileController />
    </BrowserRouter>
  );
};

describe('MobileController UI Elements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful connection
    const mockConnection = {
      on: vi.fn(),
    };
    vi.mocked(peerManager.initialize).mockResolvedValue(undefined);
    vi.mocked(peerManager.connectToHost).mockResolvedValue(mockConnection as any);
  });

  it('should not display timer in controller interface', async () => {
    renderMobileController();
    
    // Wait for connection to establish
    await waitFor(() => {
      expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
    });
    
    // Ensure no timer-related elements are present
    expect(screen.queryByText(/timer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/seconds/i)).not.toBeInTheDocument();
  });

  it('should display required UI elements when connected', async () => {
    renderMobileController();
    
    // Wait for connection to establish
    await waitFor(() => {
      expect(screen.getByText('Connected Controller')).toBeInTheDocument();
    });
    
    // Check for essential UI elements
    expect(screen.getByText('SKIP')).toBeInTheDocument();
    expect(screen.getByText('CORRECT')).toBeInTheDocument();
    expect(screen.getByText('Wait for your turn to start...')).toBeInTheDocument();
  });

  it('should display word when game state has current card', async () => {
    const mockConnection = {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          // Simulate receiving game state with a word
          setTimeout(() => {
            callback({
              type: 'SYNC_STATE',
              payload: {
                currentCard: {
                  words: ['TEST_WORD', 'NEXT_WORD']
                },
                currentWordIndex: 0,
                teamName: 'Blue Team',
                teamColor: 'blue',
                timerActive: true,
                timeLeft: 30,
                isPaused: false,
                // Add new required fields for card visibility
                activeTeamColor: 'blue',  // Same as teamColor so card should show
                connectionCount: 1,       // Single controller scenario
                canStartTurn: false,
                gamePhase: 'turnActive'   // Active turn phase
              }
            });
          }, 0);
        }
      }),
    };
    
    vi.mocked(peerManager.connectToHost).mockResolvedValue(mockConnection as any);
    
    renderMobileController();
    
    // Wait for the word to appear
    await waitFor(() => {
      expect(screen.getByText('TEST_WORD')).toBeInTheDocument();
    });
    
    // Verify action buttons are present
    expect(screen.getByText('SKIP')).toBeInTheDocument();
    expect(screen.getByText('CORRECT')).toBeInTheDocument();
  });

  it('should display team information without timer', async () => {
    const mockConnection = {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          setTimeout(() => {
            callback({
              type: 'SYNC_STATE',
              payload: {
                teamName: 'Red Team',
                teamColor: 'red',
                timerActive: false,
                timeLeft: 0,
                isPaused: false,
                // Add new required fields
                activeTeamColor: 'blue',  // Different from teamColor
                connectionCount: 2,       // Two controllers
                canStartTurn: false,
                gamePhase: 'playing'      // Not active turn
              }
            });
          }, 0);
        }
      }),
    };
    
    vi.mocked(peerManager.connectToHost).mockResolvedValue(mockConnection as any);
    
    renderMobileController();
    
    await waitFor(() => {
      expect(screen.getByText('Red Team')).toBeInTheDocument();
      expect(screen.getByText('Connected Controller')).toBeInTheDocument();
    });
    
    // Ensure no timer display is present
    expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
  });
});

describe('MobileController Team-Specific Card Visibility', () => {
  let mockConnection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConnection = {
      on: vi.fn(),
    };
    vi.mocked(peerManager.initialize).mockResolvedValue(undefined);
    vi.mocked(peerManager.connectToHost).mockResolvedValue(mockConnection);
  });

  it('should show card to active team controller with two controllers', async () => {
    // Set up mock connection for active team controller
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['ACTIVE_TEAM_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: true,
              timeLeft: 30,
              isPaused: false,
              activeTeamColor: 'blue',  // Same as teamColor - should show card
              connectionCount: 2,       // Two controllers
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for the word to appear for active team
    await waitFor(() => {
      expect(screen.getByText('ACTIVE_TEAM_WORD')).toBeInTheDocument();
    });

    // Verify action buttons are enabled
    const skipButton = screen.getByText('SKIP').closest('button');
    const correctButton = screen.getByText('CORRECT').closest('button');
    expect(skipButton).not.toBeDisabled();
    expect(correctButton).not.toBeDisabled();
  });

  it('should show waiting message to non-active team controller with two controllers', async () => {
    // Set up mock connection for non-active team controller
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['HIDDEN_WORD'] },
              currentWordIndex: 0,
              teamName: 'Red Team',
              teamColor: 'red',
              timerActive: true,
              timeLeft: 30,
              isPaused: false,
              activeTeamColor: 'blue',  // Different from teamColor - should not show card
              connectionCount: 2,       // Two controllers
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for waiting message to appear
    await waitFor(() => {
      expect(screen.getByText('Blue team is playing...')).toBeInTheDocument();
    });

    // Verify word is not shown
    expect(screen.queryByText('HIDDEN_WORD')).not.toBeInTheDocument();

    // Verify action buttons are disabled
    const skipButton = screen.getByText('SKIP').closest('button');
    const correctButton = screen.getByText('CORRECT').closest('button');
    expect(skipButton).toBeDisabled();
    expect(correctButton).toBeDisabled();
  });

  it('should always show card to single controller regardless of team assignment', async () => {
    // Set up mock connection for single controller with different team than active
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['SINGLE_CONTROLLER_WORD'] },
              currentWordIndex: 0,
              teamName: 'Red Team',
              teamColor: 'red',
              timerActive: true,
              timeLeft: 30,
              isPaused: false,
              activeTeamColor: 'blue',  // Different from teamColor but single controller
              connectionCount: 1,       // Single controller - should always show
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for the word to appear even though team doesn't match
    await waitFor(() => {
      expect(screen.getByText('SINGLE_CONTROLLER_WORD')).toBeInTheDocument();
    });

    // Verify action buttons are enabled
    const skipButton = screen.getByText('SKIP').closest('button');
    const correctButton = screen.getByText('CORRECT').closest('button');
    expect(skipButton).not.toBeDisabled();
    expect(correctButton).not.toBeDisabled();
  });

  it('should not show card when game phase is not turnActive', async () => {
    // Set up mock connection with non-active game phase
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['SHOULD_NOT_SHOW'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: false,
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'playing'  // Not turnActive - should not show card
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for waiting message
    await waitFor(() => {
      expect(screen.getByText('Wait for your turn to start...')).toBeInTheDocument();
    });

    // Verify word is not shown
    expect(screen.queryByText('SHOULD_NOT_SHOW')).not.toBeInTheDocument();

    // Verify action buttons are disabled
    const skipButton = screen.getByText('SKIP').closest('button');
    const correctButton = screen.getByText('CORRECT').closest('button');
    expect(skipButton).toBeDisabled();
    expect(correctButton).toBeDisabled();
  });
});
  let mockConnection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConnection = {
      on: vi.fn(),
    };
    vi.mocked(peerManager.initialize).mockResolvedValue(undefined);
    vi.mocked(peerManager.connectToHost).mockResolvedValue(mockConnection);
  });

  it('should send PAUSE action when pause button is clicked', async () => {
    // Set up mock connection to provide game state
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: true,
              timeLeft: 30,
              isPaused: false,
              // Add new required fields for card visibility
              activeTeamColor: 'blue',  // Same as teamColor so card should show
              connectionCount: 1,       // Single controller scenario
              canStartTurn: false,
              gamePhase: 'turnActive'   // Active turn phase
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for component to load and show pause button
    await waitFor(() => {
      expect(screen.getByText('TEST_WORD')).toBeInTheDocument();
    });

    // Find and click the pause button
    const pauseButton = screen.getByRole('button', { name: 'Pause game' });
    fireEvent.click(pauseButton);

    // Verify PAUSE action was sent
    expect(peerManager.send).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: 'PAUSE'
    });
  });

  it('should display pause overlay when game is paused', async () => {
    // Set up mock connection to provide paused game state
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused state to be displayed
    await waitFor(() => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    // Verify pause overlay elements are present
    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume game' })).toBeInTheDocument();
  });

  it('should send RESUME action when resume button is clicked', async () => {
    // Set up mock connection to provide paused game state
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused state to be displayed
    await waitFor(() => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    // Find and click the resume button
    const resumeButton = screen.getByRole('button', { name: 'Resume game' });
    fireEvent.click(resumeButton);

    // Verify RESUME action was sent
    expect(peerManager.send).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: 'RESUME'
    });
  });

  it('should show pause indicator when waiting and game is paused', async () => {
    // Set up mock connection to provide paused game state with no current card
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: null,
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'red',  // Different team is active
              connectionCount: 2,
              canStartTurn: false,
              gamePhase: 'playing'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused indicator to be displayed
    await waitFor(() => {
      expect(screen.getByText('Game Paused')).toBeInTheDocument();
    });

    // Verify pause indicator is shown in waiting state
    expect(screen.getByText('Wait for your turn to start...')).toBeInTheDocument();
    expect(screen.getByText('Game Paused')).toBeInTheDocument();
  });

  it('should disable action buttons when game is paused', async () => {
    // Set up mock connection to provide paused game state with current card
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: true,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused state to be displayed
    await waitFor(() => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

});

describe('MobileController Pause Functionality', () => {
  let mockConnection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConnection = {
      on: vi.fn(),
    };
    vi.mocked(peerManager.initialize).mockResolvedValue(undefined);
    vi.mocked(peerManager.connectToHost).mockResolvedValue(mockConnection);
  });

  it('should send PAUSE action when pause button is clicked', async () => {
    // Set up mock connection to provide game state
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: true,
              timeLeft: 30,
              isPaused: false,
              // Add new required fields for card visibility
              activeTeamColor: 'blue',  // Same as teamColor so card should show
              connectionCount: 1,       // Single controller scenario
              canStartTurn: false,
              gamePhase: 'turnActive'   // Active turn phase
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for component to load and show pause button
    await waitFor(() => {
      expect(screen.getByText('TEST_WORD')).toBeInTheDocument();
    });

    // Find and click the pause button
    const pauseButton = screen.getByRole('button', { name: 'Pause game' });
    fireEvent.click(pauseButton);

    // Verify PAUSE action was sent
    expect(peerManager.send).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: 'PAUSE'
    });
  });

  it('should display pause overlay when game is paused', async () => {
    // Set up mock connection to provide paused game state
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused state to be displayed
    await waitFor(() => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    // Verify pause overlay elements are present
    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume game' })).toBeInTheDocument();
  });

  it('should send RESUME action when resume button is clicked', async () => {
    // Set up mock connection to provide paused game state
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused state to be displayed
    await waitFor(() => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    // Find and click the resume button
    const resumeButton = screen.getByRole('button', { name: 'Resume game' });
    fireEvent.click(resumeButton);

    // Verify RESUME action was sent
    expect(peerManager.send).toHaveBeenCalledWith({
      type: 'ACTION',
      payload: 'RESUME'
    });
  });

  it('should show pause indicator when waiting and game is paused', async () => {
    // Set up mock connection to provide paused game state with no current card
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: null,
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: false,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'red',  // Different team is active
              connectionCount: 2,
              canStartTurn: false,
              gamePhase: 'playing'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused indicator to be displayed
    await waitFor(() => {
      expect(screen.getByText('Game Paused')).toBeInTheDocument();
    });

    // Verify pause indicator is shown in waiting state
    expect(screen.getByText('Wait for your turn to start...')).toBeInTheDocument();
    expect(screen.getByText('Game Paused')).toBeInTheDocument();
  });

  it('should disable action buttons when game is paused', async () => {
    // Set up mock connection to provide paused game state with current card
    mockConnection.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'data') {
        setTimeout(() => {
          callback({
            type: 'SYNC_STATE',
            payload: {
              currentCard: { words: ['TEST_WORD'] },
              currentWordIndex: 0,
              teamName: 'Blue Team',
              teamColor: 'blue',
              timerActive: true,
              timeLeft: 30,
              isPaused: true,
              // Add new required fields
              activeTeamColor: 'blue',
              connectionCount: 1,
              canStartTurn: false,
              gamePhase: 'turnActive'
            }
          });
        }, 0);
      }
    });

    renderMobileController();
    
    // Wait for paused state to be displayed
    await waitFor(() => {
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    // Verify action buttons are disabled when paused
    const skipButton = screen.getByText('SKIP').closest('button');
    const correctButton = screen.getByText('CORRECT').closest('button');
    
    expect(skipButton).toBeDisabled();
    expect(correctButton).toBeDisabled();
  });
});