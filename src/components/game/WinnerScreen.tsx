import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Language, useTranslation } from '@/lib/i18n';
import { Trophy, Sparkles, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinnerScreenProps {
  winnerName: string;
  winnerColor: 'blue' | 'red';
  language: Language;
  onPlayAgain: () => void;
}

const WinnerScreen: React.FC<WinnerScreenProps> = ({
  winnerName,
  winnerColor,
  language,
  onPlayAgain,
}) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';

  React.useEffect(() => {
    // Fire confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = winnerColor === 'blue' 
      ? ['#3b82f6', '#60a5fa', '#93c5fd'] 
      : ['#ef4444', '#f87171', '#fca5a5'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [winnerColor]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Trophy className={`w-32 h-32 mx-auto mb-6 ${
            winnerColor === 'blue' ? 'text-team-blue' : 'text-team-red'
          }`} />
        </motion.div>

        <motion.div
          className="flex items-center justify-center gap-2 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-5xl font-display font-bold">
            {t('winner')}
          </h1>
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>

        <motion.p
          className={`text-6xl font-display font-bold mb-8 ${
            winnerColor === 'blue' ? 'text-team-blue' : 'text-team-red'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {winnerName}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="px-8 py-6 text-xl font-display gap-2"
          >
            <RotateCcw className="w-6 h-6" />
            {t('playAgain')}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WinnerScreen;
