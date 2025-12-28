import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Card, getDigitAtPosition } from '@/lib/gameLogic';
import { Language, useTranslation } from '@/lib/i18n';
import { Check, X, Sparkles } from 'lucide-react';

interface SpecialTurnPanelProps {
  cards: Card[];
  currentCardIndex: number;
  teamPosition: number;
  teamPoints: number;
  opponentPoints: number;
  language: Language;
  onTeamGuessed: () => void;
  onOpponentGuessed: () => void;
  onFinish: () => void;
  isHostMode?: boolean;
}

const SpecialTurnPanel: React.FC<SpecialTurnPanelProps> = ({
  cards,
  currentCardIndex,
  teamPosition,
  teamPoints,
  opponentPoints,
  language,
  onTeamGuessed,
  onOpponentGuessed,
  onFinish,
  isHostMode = false,
}) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';
  const activeDigit = getDigitAtPosition(teamPosition);

  const isFinished = currentCardIndex >= cards.length;
  const currentCard = cards[currentCardIndex];

  return (
    <div className="game-card p-6 w-full max-w-lg mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-accent" />
        <h2 className="text-2xl font-display font-bold text-accent">
          {t('specialTurn')}
        </h2>
        <Sparkles className="w-6 h-6 text-accent" />
      </div>

      {/* Score display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-team-blue/10 p-4 rounded-xl text-center">
          <p className="text-3xl font-display font-bold text-team-blue">
            {teamPoints}
          </p>
          <p className="text-sm text-muted-foreground font-body">
            {t('yourTeamGuessed')}
          </p>
        </div>
        <div className="bg-team-red/10 p-4 rounded-xl text-center">
          <p className="text-3xl font-display font-bold text-team-red">
            {opponentPoints}
          </p>
          <p className="text-sm text-muted-foreground font-body">
            {t('opponentTeamGuessed')}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 justify-center mb-6">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center font-display font-bold
              ${index < currentCardIndex
                ? 'bg-success text-success-foreground'
                : index === currentCardIndex
                  ? 'bg-primary text-primary-foreground animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }
            `}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {!isFinished ? (
        <>
          {/* Current word - only show on controller, not on host */}
          {!isHostMode && (
            <>
              <motion.div
                key={currentCardIndex}
                className="bg-primary/10 p-6 rounded-xl text-center mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-sm text-muted-foreground mb-2 font-body">
                  {t('wordNumber')} {activeDigit}
                </p>
                <p className="text-4xl font-display font-bold text-primary">
                  {currentCard.words[activeDigit]}
                </p>
              </motion.div>

              {/* Action buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={onTeamGuessed}
                  className="btn-correct px-6 py-4"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {t('yourTeamGuessed')}
                </Button>
                <Button
                  onClick={onOpponentGuessed}
                  className="btn-skip px-6 py-4"
                >
                  <X className="w-5 h-5 mr-2" />
                  {t('opponentTeamGuessed')}
                </Button>
              </div>
            </>
          )}

          {/* Host mode message */}
          {isHostMode && (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground font-body">
                {t('controllerActiveMessage')}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="text-xl font-body mb-4">
            {t('movement')}: <strong className="text-primary">+{teamPoints}</strong> / <strong className="text-destructive">+{opponentPoints}</strong>
          </p>
          <Button onClick={onFinish} className="px-8 py-4 text-lg font-display">
            {t('finishSpecialTurn')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SpecialTurnPanel;
