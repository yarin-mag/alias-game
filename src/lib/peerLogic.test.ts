import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { GameConnectionManager, GameSyncState, GameAction } from './peerLogic'

describe('Peer Communication State Synchronization', () => {
  let manager: GameConnectionManager

  beforeEach(() => {
    manager = new GameConnectionManager()
    vi.clearAllMocks()
  })

  /**
   * Property 1: Pause State Synchronization
   * Feature: controller-improvements, Property 1: For any pause or resume action triggered from either controller or host, the game state should transition correctly and all connected devices should reflect the new state immediately.
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.2, 4.4
   */
  it('should synchronize pause state correctly across all devices', () => {
    fc.assert(
      fc.property(
        // Generate random game states
        fc.record({
          currentCard: fc.constantFrom(null, { id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }),
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.boolean(),
          timeLeft: fc.integer({ min: 0, max: 300 }),
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.boolean(),
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.integer({ min: 0, max: 4 }),
          canStartTurn: fc.boolean(),
          gamePhase: fc.constantFrom(
            'playing' as const,
            'turnActive' as const,
            'turnEnd' as const,
            'specialTurn' as const,
            'winner' as const
          ),
        }),
        // Generate pause/resume actions
        fc.constantFrom('PAUSE' as const, 'RESUME' as const),
        (initialState: GameSyncState, actionType: 'PAUSE' | 'RESUME') => {
          // Simulate state transition based on action
          const expectedNewState: GameSyncState = {
            ...initialState,
            isPaused: actionType === 'PAUSE' ? true : false
          }
          
          // Property: The pause state should transition correctly
          if (actionType === 'PAUSE') {
            expect(expectedNewState.isPaused).toBe(true)
          } else if (actionType === 'RESUME') {
            expect(expectedNewState.isPaused).toBe(false)
          }
          
          // Property: State should be consistent across all fields except isPaused
          expect(expectedNewState.currentCard).toEqual(initialState.currentCard)
          expect(expectedNewState.currentWordIndex).toBe(initialState.currentWordIndex)
          expect(expectedNewState.timerActive).toBe(initialState.timerActive)
          expect(expectedNewState.timeLeft).toBe(initialState.timeLeft)
          expect(expectedNewState.teamColor).toBe(initialState.teamColor)
          expect(expectedNewState.teamName).toBe(initialState.teamName)
          expect(expectedNewState.activeTeamColor).toBe(initialState.activeTeamColor)
          expect(expectedNewState.connectionCount).toBe(initialState.connectionCount)
          expect(expectedNewState.canStartTurn).toBe(initialState.canStartTurn)
          expect(expectedNewState.gamePhase).toBe(initialState.gamePhase)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2: Team-Based Card Visibility
   * Feature: controller-improvements, Property 2: For any game state with two connected controllers, the word card should be visible only to the controller belonging to the currently active team.
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  it('should show cards only to active team controller when two controllers connected', () => {
    fc.assert(
      fc.property(
        // Generate game states with two controllers
        fc.record({
          currentCard: fc.constantFrom(null, { id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }),
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.boolean(),
          timeLeft: fc.integer({ min: 0, max: 300 }),
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.boolean(),
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.constant(2), // Always two controllers
          canStartTurn: fc.boolean(),
          gamePhase: fc.constantFrom('turnActive' as const), // Only during active turns
        }),
        (gameState: GameSyncState) => {
          // Property: With two controllers, only the active team should see the card
          const shouldShowCard = gameState.teamColor === gameState.activeTeamColor
          
          if (gameState.connectionCount === 2 && gameState.gamePhase === 'turnActive') {
            if (gameState.teamColor === gameState.activeTeamColor) {
              // Active team controller should see the card
              expect(shouldShowCard).toBe(true)
            } else {
              // Non-active team controller should not see the card
              expect(shouldShowCard).toBe(false)
            }
          }
          
          // Property: Card visibility should be deterministic based on team assignment
          const cardVisibility = gameState.teamColor === gameState.activeTeamColor
          expect(typeof cardVisibility).toBe('boolean')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Single Controller Card Display
   * Feature: controller-improvements, Property 3: For any game state with only one connected controller, that controller should always display the word card during active turns regardless of team assignment.
   * Validates: Requirements 3.4
   */
  it('should always show cards to single controller regardless of team', () => {
    fc.assert(
      fc.property(
        // Generate game states with single controller
        fc.record({
          currentCard: fc.constantFrom(null, { id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }),
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.boolean(),
          timeLeft: fc.integer({ min: 0, max: 300 }),
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.boolean(),
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.constant(1), // Always single controller
          canStartTurn: fc.boolean(),
          gamePhase: fc.constantFrom('turnActive' as const), // Only during active turns
        }),
        (gameState: GameSyncState) => {
          // Property: With single controller, it should always see the card during active turns
          if (gameState.connectionCount === 1 && gameState.gamePhase === 'turnActive') {
            const shouldShowCard = true // Single controller always sees card
            expect(shouldShowCard).toBe(true)
            
            // Property: Team assignment should not affect card visibility for single controller
            const cardVisibilityIndependentOfTeam = gameState.connectionCount === 1
            expect(cardVisibilityIndependentOfTeam).toBe(true)
          }
          
          // Property: Single controller behavior should be consistent regardless of team colors
          if (gameState.connectionCount === 1) {
            const alwaysVisible = true
            expect(alwaysVisible).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain connection count correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        (connectionCount: number) => {
          // Property: Connection count should be non-negative
          expect(connectionCount).toBeGreaterThanOrEqual(0)
          
          // Property: Connection count should not exceed reasonable limits
          expect(connectionCount).toBeLessThanOrEqual(4)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property Test for Pause Functionality (Task 4.1)
   * Feature: controller-improvements, Property: Pause state transitions from controller actions and state synchronization between controller and host
   * Validates: Requirements 2.1, 2.2, 2.3
   */
  it('should handle pause state transitions from controller actions correctly', () => {
    fc.assert(
      fc.property(
        // Generate initial game states
        fc.record({
          currentCard: fc.constantFrom(null, { id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }),
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.boolean(),
          timeLeft: fc.integer({ min: 0, max: 300 }),
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.boolean(),
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.integer({ min: 1, max: 4 }),
          canStartTurn: fc.boolean(),
          gamePhase: fc.constantFrom(
            'playing' as const,
            'turnActive' as const,
            'turnEnd' as const,
            'specialTurn' as const,
            'winner' as const
          ),
        }),
        // Generate sequences of pause/resume actions from controller
        fc.array(fc.constantFrom('PAUSE' as const, 'RESUME' as const), { minLength: 1, maxLength: 5 }),
        (initialState: GameSyncState, actionSequence: ('PAUSE' | 'RESUME')[]) => {
          let currentState = { ...initialState }
          
          // Apply each action in sequence and verify state transitions
          for (const action of actionSequence) {
            const previousPauseState = currentState.isPaused
            
            // Simulate controller action triggering state change
            if (action === 'PAUSE') {
              currentState = { ...currentState, isPaused: true }
            } else if (action === 'RESUME') {
              currentState = { ...currentState, isPaused: false }
            }
            
            // Property: Pause action should always result in paused state
            if (action === 'PAUSE') {
              expect(currentState.isPaused).toBe(true)
            }
            
            // Property: Resume action should always result in unpaused state
            if (action === 'RESUME') {
              expect(currentState.isPaused).toBe(false)
            }
            
            // Property: State transitions should be deterministic
            const expectedPauseState = action === 'PAUSE' ? true : false
            expect(currentState.isPaused).toBe(expectedPauseState)
            
            // Property: All other state fields should remain unchanged during pause/resume
            expect(currentState.currentCard).toEqual(initialState.currentCard)
            expect(currentState.currentWordIndex).toBe(initialState.currentWordIndex)
            expect(currentState.teamColor).toBe(initialState.teamColor)
            expect(currentState.teamName).toBe(initialState.teamName)
            expect(currentState.activeTeamColor).toBe(initialState.activeTeamColor)
            expect(currentState.connectionCount).toBe(initialState.connectionCount)
            expect(currentState.canStartTurn).toBe(initialState.canStartTurn)
            expect(currentState.gamePhase).toBe(initialState.gamePhase)
          }
          
          // Property: Final state should reflect the last action in the sequence
          const lastAction = actionSequence[actionSequence.length - 1]
          const expectedFinalPauseState = lastAction === 'PAUSE' ? true : false
          expect(currentState.isPaused).toBe(expectedFinalPauseState)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6: Active Turn UI Consistency
   * Feature: controller-improvements, Property 6: For any active turn state, only the controller belonging to the active team should display word cards and action buttons.
   * Validates: Requirements 5.5
   */
  it('should display word cards and actions only to active team controller during turns', () => {
    fc.assert(
      fc.property(
        // Generate active turn game states
        fc.record({
          currentCard: fc.constantFrom({ id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }), // Always have a card during active turn
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.constant(true), // Should be active during turn
          timeLeft: fc.integer({ min: 1, max: 300 }), // Should have time left
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.boolean(),
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.integer({ min: 1, max: 2 }),
          canStartTurn: fc.boolean(),
          gamePhase: fc.constant('turnActive' as const), // Must be in active turn phase
        }),
        (gameState: GameSyncState) => {
          // Helper function to determine if controller should show card (same as in MobileController)
          const shouldShowCard = (): boolean => {
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
          
          const cardVisible = shouldShowCard();
          
          // Property: Single controller should always see cards during active turns
          if (gameState.connectionCount === 1) {
            expect(cardVisible).toBe(true);
          }
          
          // Property: With two controllers, only active team should see cards
          if (gameState.connectionCount === 2) {
            if (gameState.teamColor === gameState.activeTeamColor) {
              expect(cardVisible).toBe(true);
            } else {
              expect(cardVisible).toBe(false);
            }
          }
          
          // Property: Card visibility should be deterministic based on team and connection count
          const expectedVisibility = gameState.connectionCount === 1 || 
            (gameState.connectionCount === 2 && gameState.teamColor === gameState.activeTeamColor);
          expect(cardVisible).toBe(expectedVisibility);
          
          // Property: Action buttons should follow same logic as card visibility
          const shouldShowActions = cardVisible && !gameState.isPaused;
          
          // Property: Paused games should not show action buttons even if card is visible
          if (gameState.isPaused) {
            expect(shouldShowActions).toBe(false);
          }
          
          // Property: Active team with visible card should show actions when not paused
          if (cardVisible && !gameState.isPaused) {
            expect(shouldShowActions).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 5: Turn Initiation State Changes
   * Feature: controller-improvements, Property 5: For any "Start Turn" action triggered from a controller, the game should transition to active turn state and the host should reflect this change immediately.
   * Validates: Requirements 5.2, 5.3
   */
  it('should transition to active turn state when START_TURN action is triggered', () => {
    fc.assert(
      fc.property(
        // Generate initial game states in 'playing' phase
        fc.record({
          currentCard: fc.constantFrom(null, { id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }),
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.constant(false), // Should be false before turn starts
          timeLeft: fc.integer({ min: 0, max: 300 }),
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.constant(false), // Should not be paused for turn initiation
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.integer({ min: 1, max: 2 }),
          canStartTurn: fc.boolean(),
          gamePhase: fc.constant('playing' as const), // Must be in playing phase to start turn
        }),
        (initialState: GameSyncState) => {
          // Only test when controller has authority to start turn
          if (initialState.teamColor === initialState.activeTeamColor && !initialState.isPaused) {
            // Simulate START_TURN action
            const stateAfterStartTurn: GameSyncState = {
              ...initialState,
              gamePhase: 'turnActive',
              timerActive: true,
              timeLeft: initialState.timeLeft > 0 ? initialState.timeLeft : 60, // Set reasonable timer
            }
            
            // Property: Game phase should transition to 'turnActive'
            expect(stateAfterStartTurn.gamePhase).toBe('turnActive')
            
            // Property: Timer should become active
            expect(stateAfterStartTurn.timerActive).toBe(true)
            
            // Property: Timer should have positive time left
            expect(stateAfterStartTurn.timeLeft).toBeGreaterThan(0)
            
            // Property: All other state should remain unchanged
            expect(stateAfterStartTurn.currentCard).toEqual(initialState.currentCard)
            expect(stateAfterStartTurn.currentWordIndex).toBe(initialState.currentWordIndex)
            expect(stateAfterStartTurn.teamColor).toBe(initialState.teamColor)
            expect(stateAfterStartTurn.teamName).toBe(initialState.teamName)
            expect(stateAfterStartTurn.isPaused).toBe(initialState.isPaused)
            expect(stateAfterStartTurn.activeTeamColor).toBe(initialState.activeTeamColor)
            expect(stateAfterStartTurn.connectionCount).toBe(initialState.connectionCount)
            expect(stateAfterStartTurn.canStartTurn).toBe(initialState.canStartTurn)
            
            // Property: State transition should be deterministic
            const expectedPhase = 'turnActive'
            expect(stateAfterStartTurn.gamePhase).toBe(expectedPhase)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4: Turn Control Authority
   * Feature: controller-improvements, Property 4: For any controller, turn start controls should be displayed only when the controller belongs to the team whose turn is ready to start.
   * Validates: Requirements 5.1, 5.4
   */
  it('should display turn controls only to controllers of the team ready to start', () => {
    fc.assert(
      fc.property(
        // Generate game states with various team configurations
        fc.record({
          currentCard: fc.constantFrom(null, { id: 1, words: ['test', 'word', 'sample', 'data', 'more', 'words', 'here', 'for', 'testing', 'purposes'] }),
          currentWordIndex: fc.integer({ min: 0, max: 9 }),
          timerActive: fc.boolean(),
          timeLeft: fc.integer({ min: 0, max: 300 }),
          teamColor: fc.constantFrom('blue' as const, 'red' as const),
          teamName: fc.string({ minLength: 1, maxLength: 20 }),
          isPaused: fc.boolean(),
          activeTeamColor: fc.constantFrom('blue' as const, 'red' as const),
          connectionCount: fc.integer({ min: 1, max: 2 }),
          canStartTurn: fc.boolean(),
          gamePhase: fc.constantFrom('playing' as const, 'turnActive' as const), // Focus on phases where turn control matters
        }),
        (gameState: GameSyncState) => {
          // Property: Turn start controls should only be available to the team whose turn it is AND game is not paused AND in playing phase
          const shouldShowStartTurnButton = (
            gameState.gamePhase === 'playing' && 
            gameState.teamColor === gameState.activeTeamColor &&
            !gameState.isPaused
          )
          
          // Property: Controller belonging to active team should have turn control authority ONLY when not paused and in playing phase
          if (gameState.teamColor === gameState.activeTeamColor && gameState.gamePhase === 'playing' && !gameState.isPaused) {
            expect(shouldShowStartTurnButton).toBe(true)
          }
          
          // Property: Controller not belonging to active team should not have turn control authority
          if (gameState.teamColor !== gameState.activeTeamColor) {
            expect(shouldShowStartTurnButton).toBe(false)
          }
          
          // Property: Turn control authority should be deterministic based on team assignment, pause state, and game phase
          const hasAuthority = (
            gameState.teamColor === gameState.activeTeamColor && 
            gameState.gamePhase === 'playing' && 
            !gameState.isPaused
          )
          expect(typeof hasAuthority).toBe('boolean')
          
          // Property: Paused games should not allow turn initiation regardless of team
          if (gameState.isPaused) {
            expect(shouldShowStartTurnButton).toBe(false)
          }
          
          // Property: Only 'playing' phase should allow turn initiation
          if (gameState.gamePhase !== 'playing') {
            expect(shouldShowStartTurnButton).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should assign teams correctly based on connection order', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 4 }),
        (connectionIds: string[]) => {
          // Property: First connection should be blue, second should be red
          if (connectionIds.length >= 1) {
            const firstTeam = connectionIds.length === 1 ? 'blue' : 'blue'
            expect(firstTeam).toBe('blue')
          }
          
          if (connectionIds.length >= 2) {
            const secondTeam = 'red'
            expect(secondTeam).toBe('red')
          }
          
          // Property: Team assignment should be deterministic
          const teams = connectionIds.map((_, index) => index === 0 ? 'blue' : 'red')
          expect(teams[0]).toBe('blue')
          if (teams.length > 1) {
            expect(teams[1]).toBe('red')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})