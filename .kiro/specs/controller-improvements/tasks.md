# Implementation Plan: Controller Improvements

## Overview

This implementation plan addresses five key improvements to the mobile controller system: removing timer display from controllers, fixing pause functionality, implementing team-specific card visibility, adding pause controls to the host game, and enabling turn initiation from controllers. The tasks are organized to build incrementally, starting with core data model updates and progressing through UI and communication enhancements.

## Tasks

- [x] 1. Update peer communication interfaces and game state synchronization
  - Extend GameSyncState interface with new fields for team tracking and turn control
  - Add START_TURN action type to GameAction union
  - Update connection management to track team assignments
  - _Requirements: 2.4, 3.1, 5.1_

- [x] 1.1 Write property test for state synchronization
  - **Property 1: Pause State Synchronization**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.2, 4.4**

- [x] 2. Implement team assignment logic in peer manager
  - Add team assignment based on connection order (first = blue, second = red)
  - Update connection tracking to include team information
  - Implement team reassignment when connections drop
  - _Requirements: 3.1, 3.4, 5.1_

- [x] 2.1 Write property test for team assignment
  - **Property 2: Team-Based Card Visibility**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 2.2 Write property test for single controller behavior
  - **Property 3: Single Controller Card Display**
  - **Validates: Requirements 3.4**

- [x] 3. Remove timer display from mobile controller interface
  - Remove timer component and related state from MobileController.tsx
  - Update controller header to remove timer display
  - Clean up timer-related styling and animations
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.1 Write unit tests for controller UI elements
  - Test timer absence in controller interface
  - Test presence of required UI elements (word, buttons)
  - _Requirements: 1.1, 1.2_

- [x] 4. Fix pause functionality in mobile controller
  - Update pause/resume button event handlers
  - Ensure proper state synchronization with host
  - Fix pause overlay display and interaction
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.1 Write property test for pause functionality
  - Test pause state transitions from controller actions
  - Test state synchronization between controller and host
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Implement team-specific card visibility logic
  - Add logic to show cards only to active team's controller
  - Implement waiting message for non-active team controllers
  - Update card visibility when turns switch
  - Handle single controller scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5.1 Write property test for card visibility
  - Test team-based card visibility with two controllers
  - Test single controller always sees cards
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Add pause controls to host game interface
  - Add pause button to GameScreen.tsx during active turns
  - Implement pause overlay or resume button when paused
  - Ensure proper state management and peer broadcasting
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6.1 Write unit tests for host pause controls
  - Test pause button presence during active turns
  - Test resume controls when game is paused
  - _Requirements: 4.1, 4.3_

- [x] 7. Implement turn initiation from controllers
  - Add "Start Turn" button to controllers for their assigned team
  - Handle START_TURN action in host game logic
  - Update turn control authority based on team assignment
  - Ensure proper state synchronization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7.1 Write property test for turn control authority
  - **Property 4: Turn Control Authority**
  - **Validates: Requirements 5.1, 5.4**

- [x] 7.2 Write property test for turn initiation
  - **Property 5: Turn Initiation State Changes**
  - **Validates: Requirements 5.2, 5.3**

- [x] 7.3 Write property test for active turn UI consistency
  - **Property 6: Active Turn UI Consistency**
  - **Validates: Requirements 5.5**

- [x] 8. Update host game to handle controller-initiated actions
  - Modify GameScreen.tsx to process START_TURN actions from controllers
  - Update state broadcasting to include new team and turn information
  - Ensure host UI reflects controller-initiated changes
  - _Requirements: 5.2, 5.3_

- [x] 8.1 Write integration tests for controller-host communication
  - Test START_TURN action processing
  - Test state synchronization after controller actions
  - _Requirements: 5.2, 5.3_

- [x] 9. Checkpoint - Ensure all tests pass and functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Final integration and cleanup
  - Remove any unused timer-related code
  - Ensure consistent styling across controller and host interfaces
  - Verify all peer communication works correctly
  - Test with multiple controller connection scenarios
  - _Requirements: All_

- [ ] 10.1 Write end-to-end integration tests
  - Test complete user flows with multiple controllers
  - Test connection/disconnection scenarios
  - Test team switching and card visibility
  - _Requirements: All_

- [ ] 11. Final checkpoint - Complete testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure proper communication between components