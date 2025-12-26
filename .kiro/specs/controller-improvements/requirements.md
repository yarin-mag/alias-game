# Requirements Document

## Introduction

This specification addresses improvements to the mobile controller functionality in the Alias game application. The current implementation has several issues with the controller interface, pause functionality, card visibility logic, and turn control distribution that need to be resolved to provide a better user experience.

## Glossary

- **Controller**: The mobile interface accessed via `/controller/{hostId}` that allows remote game control
- **Host_Game**: The main game interface displayed on the host screen at `/game/{hostId}`
- **Game_State**: The current state of the game including teams, positions, cards, and turn information
- **Peer_Manager**: The WebRTC connection manager that handles communication between host and controllers
- **Turn_Control**: The ability to start turns, make correct/skip actions, and control game flow
- **Card_Visibility**: Logic determining which connected controller sees the current word card
- **Pause_System**: The game pause/resume functionality across both host and controller interfaces

## Requirements

### Requirement 1: Timer Removal from Controller

**User Story:** As a player using the mobile controller, I want a clean interface without the timer display, so that I can focus on the word and actions without visual clutter.

#### Acceptance Criteria

1. WHEN a user accesses the mobile controller interface, THE Controller SHALL NOT display any timer countdown
2. WHEN the game is active, THE Controller SHALL show only the current word and action buttons
3. WHEN the timer information is needed, THE Host_Game SHALL be the sole display location for timing information

### Requirement 2: Controller Pause Functionality

**User Story:** As a player using the mobile controller, I want the pause button to work correctly, so that I can pause and resume the game when needed.

#### Acceptance Criteria

1. WHEN a user taps the pause button on the controller, THE Game_State SHALL transition to paused state
2. WHEN the game is paused via controller, THE Host_Game SHALL reflect the paused state immediately
3. WHEN a user taps the resume button during pause, THE Game_State SHALL transition back to active state
4. WHEN pause/resume actions are triggered, THE Peer_Manager SHALL broadcast the state change to all connected devices

### Requirement 3: Team-Specific Card Visibility

**User Story:** As a game host with two connected controllers, I want only the active team's controller to see the current word card, so that the opposing team cannot see the words during the other team's turn.

#### Acceptance Criteria

1. WHEN two controllers are connected and a turn is active, THE Controller SHALL display the word card only if it belongs to the active team
2. WHEN a controller belongs to the non-active team during a turn, THE Controller SHALL show a waiting message instead of the word card
3. WHEN team turns switch, THE Card_Visibility SHALL update to show the card only to the new active team's controller
4. WHEN only one controller is connected, THE Controller SHALL always display the word card during active turns

### Requirement 4: Host Game Pause Controls

**User Story:** As a game host, I want pause controls available on the main game screen, so that I can pause the game directly from the host interface when needed.

#### Acceptance Criteria

1. WHEN the host game is in an active turn state, THE Host_Game SHALL display a pause button
2. WHEN the host clicks the pause button, THE Game_State SHALL transition to paused state
3. WHEN the game is paused, THE Host_Game SHALL display a resume button or overlay
4. WHEN pause/resume is triggered from host, THE Peer_Manager SHALL broadcast the state change to all controllers

### Requirement 5: Controller Turn Initiation

**User Story:** As a player using the mobile controller, I want to start turns from my controller, so that I can control the game flow without needing to interact with the host screen.

#### Acceptance Criteria

1. WHEN a team's turn is ready to start and the controller belongs to that team, THE Controller SHALL display a "Start Turn" button
2. WHEN a user taps "Start Turn" on the controller, THE Turn_Control SHALL initiate the turn and begin the timer
3. WHEN a turn is started via controller, THE Host_Game SHALL reflect the active turn state immediately
4. WHEN the controller does not belong to the active team, THE Controller SHALL NOT display turn start controls
5. WHEN a turn is active, THE Controller SHALL display the word card and correct/skip buttons for the active team only