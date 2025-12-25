import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Language, useTranslation } from '@/lib/i18n';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
  language: Language;
}

const RulesModal: React.FC<RulesModalProps> = ({ open, onClose, language }) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg game-card" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-center">
            {t('rulesTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 font-body">
          {/* Normal Turn */}
          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-2">
              {t('rulesNormalTurn')}
            </h3>
            <p className="text-muted-foreground">
              {t('rulesNormalDesc')}
            </p>
          </section>
          
          {/* Controls */}
          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-2">
              {t('rulesControls')}
            </h3>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-success/20 text-success rounded font-mono text-sm">Enter</kbd>
                <span>= {t('rulesEnter').split('=')[1]}</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-destructive/20 text-destructive rounded font-mono text-sm">Space</kbd>
                <span>= {t('rulesSpace').split('=')[1]}</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded font-mono text-sm">P</kbd>
                <span>= {t('rulesP').split('=')[1]}</span>
              </li>
              <li className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded font-mono text-sm">R</kbd>
                <span>= {t('rulesR').split('=')[1]}</span>
              </li>
            </ul>
          </section>
          
          {/* Movement */}
          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-2">
              {t('rulesMovement')}
            </h3>
            <p className="text-muted-foreground">
              {t('rulesMovementDesc')}
            </p>
          </section>
          
          {/* Special Turn */}
          <section>
            <h3 className="font-display font-bold text-lg text-accent mb-2">
              {t('rulesSpecialTurn')}
            </h3>
            <p className="text-muted-foreground">
              {t('rulesSpecialDesc')}
            </p>
          </section>
        </div>
        
        <Button onClick={onClose} className="w-full mt-4">
          {t('close')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default RulesModal;
