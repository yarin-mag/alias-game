import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, SkipForward, Pause, Play, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

interface GameControlsProps {
  onCorrect: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onRules: () => void;
  onToggleHide: () => void;
  isPaused: boolean;
  isHidden: boolean;
  language: Language;
  disabled?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onCorrect,
  onSkip,
  onPause,
  onResume,
  onRules,
  onToggleHide,
  isPaused,
  isHidden,
  language,
  disabled = false,
}) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';

  return (
    <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main action buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={onCorrect}
          disabled={disabled || isPaused}
          className="btn-correct px-8 py-6 text-xl gap-2"
          size="lg"
        >
          <Check className="w-6 h-6" />
          {t('correct')}
          <kbd className="ml-2 px-2 py-1 bg-success-foreground/20 rounded text-sm">Enter</kbd>
        </Button>
        
        <Button
          onClick={onSkip}
          disabled={disabled || isPaused}
          className="btn-skip px-8 py-6 text-xl gap-2"
          size="lg"
        >
          <SkipForward className="w-6 h-6" />
          {t('skip')}
          <kbd className="ml-2 px-2 py-1 bg-destructive-foreground/20 rounded text-sm">Space</kbd>
        </Button>
      </div>
      
      {/* Secondary controls */}
      <div className="flex gap-2 justify-center">
        <Button
          onClick={isPaused ? onResume : onPause}
          variant="outline"
          className="gap-2"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {isPaused ? t('resumeGame') : t('pauseGame')}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">P</kbd>
        </Button>
        
        <Button
          onClick={onToggleHide}
          variant="outline"
          className="gap-2"
        >
          {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        
        <Button
          onClick={onRules}
          variant="ghost"
          className="gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          {t('rules')}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">R</kbd>
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
