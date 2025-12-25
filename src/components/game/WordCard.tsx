import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, getDigitAtPosition } from '@/lib/gameLogic';
import { Language } from '@/lib/i18n';

interface WordCardProps {
  card: Card;
  teamPosition: number;
  language: Language;
  isHidden: boolean;
}

const WordCard: React.FC<WordCardProps> = ({ card, teamPosition, language, isHidden }) => {
  const activeDigit = getDigitAtPosition(teamPosition);
  const isRTL = language === 'he';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={card.id}
        className="word-card p-6 w-full max-w-md mx-auto animate-card-flip"
        initial={{ rotateY: -90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: 90, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isHidden ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-4xl">🙈</div>
            <p className="text-muted-foreground mt-2 font-body">
              {language === 'he' ? 'מילים מוסתרות' : 'Words Hidden'}
            </p>
          </div>
        ) : (
          <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
            {card.words.map((word, index) => (
              <motion.div
                key={index}
                className={`
                  flex items-center gap-4 p-3 rounded-xl transition-all duration-300
                  ${index === activeDigit 
                    ? 'bg-primary text-primary-foreground scale-105 shadow-lg' 
                    : 'bg-muted/50 text-muted-foreground'
                  }
                `}
                initial={index === activeDigit ? { scale: 0.9 } : {}}
                animate={index === activeDigit ? { scale: 1.05 } : { scale: 1 }}
              >
                <span 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-lg
                    ${index === activeDigit 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-background/50'
                    }
                  `}
                >
                  {index}
                </span>
                <span className={`font-body text-lg flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {word}
                </span>
                {index === activeDigit && (
                  <motion.div
                    className="text-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    👈
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default WordCard;
