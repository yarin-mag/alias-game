import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Language, useTranslation } from '@/lib/i18n';
import { TurnResult } from '@/lib/gameLogic';
import { Check, X, ArrowRight, Trophy } from 'lucide-react';

interface TurnEndModalProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  lastWord: string | null;
  turnResult: TurnResult | null;
  currentTeamName: string;
  opponentTeamName: string;
  onOpponentGuessed: (guessed: boolean) => void;
  showOpponentQuestion: boolean;
}

const TurnEndModal: React.FC<TurnEndModalProps> = ({
  open,
  onClose,
  language,
  lastWord,
  turnResult,
  currentTeamName,
  opponentTeamName,
  onOpponentGuessed,
  showOpponentQuestion,
}) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md game-card" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-display text-center">
            ⏰ {t('turnEnded')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Last word & opponent guess */}
          {showOpponentQuestion && lastWord && (
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <p className="text-muted-foreground font-body mb-2">{t('lastWord')}:</p>
                <p className="text-3xl font-display font-bold text-primary">{lastWord}</p>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="font-body mb-4">
                  {opponentTeamName} - {t('opponentGuessed')}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => onOpponentGuessed(true)}
                    className="btn-correct px-6"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {t('yes')}
                  </Button>
                  <Button
                    onClick={() => onOpponentGuessed(false)}
                    className="btn-skip px-6"
                  >
                    <X className="w-5 h-5 mr-2" />
                    {t('no')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {turnResult && !showOpponentQuestion && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-success/10 p-4 rounded-xl text-center">
                  <Check className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-success">
                    {turnResult.correct}
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    {t('correctAnswers')}
                  </p>
                </div>
                
                <div className="bg-destructive/10 p-4 rounded-xl text-center">
                  <X className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-display font-bold text-destructive">
                    {turnResult.skipped}
                  </p>
                  <p className="text-sm text-muted-foreground font-body">
                    {t('skipped')}
                  </p>
                </div>
              </div>

              {turnResult.opponentBonus && (
                <div className="bg-accent/10 p-3 rounded-xl text-center">
                  <p className="text-accent font-body">
                    +1 {t('opponentBonus')} ({opponentTeamName})
                  </p>
                </div>
              )}

              <div className="bg-primary/10 p-4 rounded-xl text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-display font-bold text-primary">
                  {turnResult.movement > 0 ? '+' : ''}{turnResult.movement}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {t('movement')} ({currentTeamName})
                </p>
              </div>

              <Button onClick={onClose} className="w-full py-4 text-lg font-display">
                <ArrowRight className="w-5 h-5 mr-2" />
                {t('nextTurn')}
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TurnEndModal;
