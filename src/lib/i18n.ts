export type Language = 'he' | 'en';

export const translations = {
  he: {
    // Game title
    gameTitle: 'אליאס',
    subtitle: 'משחק המילים המטורף',
    
    // Setup
    setup: 'הגדרות משחק',
    teamNames: 'שמות קבוצות',
    team1: 'קבוצה 1',
    team2: 'קבוצה 2',
    team1Default: 'הכחולים',
    team2Default: 'האדומים',
    language: 'שפה',
    hebrew: 'עברית',
    english: 'English',
    turnDuration: 'משך תור (שניות)',
    allowNegative: 'אפשר תזוזה שלילית',
    startGame: 'התחל משחק!',
    
    // Game
    turn: 'תור',
    position: 'מיקום',
    startTurn: 'התחל תור',
    pauseGame: 'הפסקה',
    resumeGame: 'המשך',
    correct: 'נכון!',
    skip: 'דלג',
    wordNumber: 'מילה מספר',
    cardsUsed: 'קלפים שהשתמשנו',
    
    // Turn end
    turnEnded: 'הסתיים הזמן!',
    lastWord: 'המילה האחרונה',
    opponentGuessed: 'הקבוצה השנייה ניחשה?',
    yes: 'כן!',
    no: 'לא',
    
    // Special turn
    specialTurn: 'תור מיוחד',
    specialTurnDesc: '5 קלפים ללא הגבלת זמן',
    startSpecialTurn: 'התחל תור מיוחד',
    yourTeamGuessed: 'הקבוצה שלך ניחשה',
    opponentTeamGuessed: 'הקבוצה השנייה ניחשה',
    cardsRemaining: 'קלפים נותרו',
    finishSpecialTurn: 'סיים תור מיוחד',
    
    // Results
    movement: 'תזוזה',
    steps: 'צעדים',
    correctAnswers: 'תשובות נכונות',
    skipped: 'דילוגים',
    opponentBonus: 'בונוס יריב',
    nextTurn: 'תור הבא',
    
    // Rules
    rules: 'חוקים',
    rulesTitle: 'איך משחקים?',
    rulesNormalTurn: 'תור רגיל',
    rulesNormalDesc: 'יש לכם 60 שניות לתאר כמה שיותר מילים. המילה שלכם נקבעת לפי המיקום שלכם על הלוח!',
    rulesControls: 'שליטה',
    rulesEnter: 'Enter = ניחשו נכון',
    rulesSpace: 'Space = דלג',
    rulesP: 'P = הפסקה/המשך',
    rulesR: 'R = חוקים',
    rulesMovement: 'תזוזה על הלוח',
    rulesMovementDesc: 'צעדים = תשובות נכונות - דילוגים. אם הצד השני מנחש את המילה האחרונה, הם מקבלים +1.',
    rulesSpecialTurn: 'תור מיוחד',
    rulesSpecialDesc: '5 קלפים ללא זמן. שתי הקבוצות יכולות לענות!',
    close: 'סגור',
    
    // Winner
    winner: 'מנצחים!',
    playAgain: 'משחק חדש',
    
    // Persistence
    resumeGameTitle: 'יש משחק שמור',
    resumeQuestion: 'רוצים להמשיך מאיפה שעצרתם?',
    resume: 'המשך משחק',
    newGame: 'משחק חדש',
    
    // Board
    start: 'התחלה',
    finish: 'סיום',
  },
  en: {
    // Game title
    gameTitle: 'Alias',
    subtitle: 'The Crazy Word Game',
    
    // Setup
    setup: 'Game Setup',
    teamNames: 'Team Names',
    team1: 'Team 1',
    team2: 'Team 2',
    team1Default: 'Blue Team',
    team2Default: 'Red Team',
    language: 'Language',
    hebrew: 'עברית',
    english: 'English',
    turnDuration: 'Turn Duration (seconds)',
    allowNegative: 'Allow Negative Movement',
    startGame: 'Start Game!',
    
    // Game
    turn: 'Turn',
    position: 'Position',
    startTurn: 'Start Turn',
    pauseGame: 'Pause',
    resumeGame: 'Resume',
    correct: 'Correct!',
    skip: 'Skip',
    wordNumber: 'Word #',
    cardsUsed: 'Cards Used',
    
    // Turn end
    turnEnded: "Time's Up!",
    lastWord: 'The Last Word',
    opponentGuessed: 'Did opponent guess it?',
    yes: 'Yes!',
    no: 'No',
    
    // Special turn
    specialTurn: 'Special Turn',
    specialTurnDesc: '5 cards with no time limit',
    startSpecialTurn: 'Start Special Turn',
    yourTeamGuessed: 'Your team guessed',
    opponentTeamGuessed: 'Opponent guessed',
    cardsRemaining: 'Cards remaining',
    finishSpecialTurn: 'Finish Special Turn',
    
    // Results
    movement: 'Movement',
    steps: 'steps',
    correctAnswers: 'Correct',
    skipped: 'Skipped',
    opponentBonus: 'Opponent Bonus',
    nextTurn: 'Next Turn',
    
    // Rules
    rules: 'Rules',
    rulesTitle: 'How to Play?',
    rulesNormalTurn: 'Normal Turn',
    rulesNormalDesc: 'You have 60 seconds to describe as many words as possible. Your word is determined by your position on the board!',
    rulesControls: 'Controls',
    rulesEnter: 'Enter = Guessed correctly',
    rulesSpace: 'Space = Skip',
    rulesP: 'P = Pause/Resume',
    rulesR: 'R = Rules',
    rulesMovement: 'Board Movement',
    rulesMovementDesc: 'Steps = Correct answers - Skips. If the other team guesses the last word, they get +1.',
    rulesSpecialTurn: 'Special Turn',
    rulesSpecialDesc: '5 cards with no time limit. Both teams can answer!',
    close: 'Close',
    
    // Winner
    winner: 'Winner!',
    playAgain: 'Play Again',
    
    // Persistence
    resumeGameTitle: 'Saved Game Found',
    resumeQuestion: 'Do you want to continue where you left off?',
    resume: 'Resume Game',
    newGame: 'New Game',
    
    // Board
    start: 'Start',
    finish: 'Finish',
  },
};

export const useTranslation = (language: Language) => {
  return (key: keyof typeof translations.he): string => {
    return translations[language][key] || key;
  };
};
