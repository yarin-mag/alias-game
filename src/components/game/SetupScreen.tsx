import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';
import { Language, useTranslation } from '@/lib/i18n';
import { Gamepad2, Globe, Clock, ArrowRightLeft } from 'lucide-react';

interface SetupScreenProps {
  onStart: (
    team1Name: string,
    team2Name: string,
    language: Language,
    turnDuration: number,
    allowNegative: boolean
  ) => void;
  savedGameExists: boolean;
  onResume: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  onStart,
  savedGameExists,
  onResume,
  language,
  onLanguageChange,
}) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';
  
  const [team1Name, setTeam1Name] = useState(t('team1Default'));
  const [team2Name, setTeam2Name] = useState(t('team2Default'));
  const [turnDuration, setTurnDuration] = useState(60);
  const [allowNegative, setAllowNegative] = useState(false);

  const handleStart = () => {
    onStart(
      team1Name || t('team1Default'),
      team2Name || t('team2Default'),
      language,
      turnDuration,
      allowNegative
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-block mb-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Gamepad2 className="w-16 h-16 text-primary mx-auto" />
          </motion.div>
          <h1 className="text-5xl font-display font-bold text-primary mb-2 text-shadow-lg">
            {t('gameTitle')}
          </h1>
          <p className="text-xl text-muted-foreground font-body">
            {t('subtitle')}
          </p>
        </div>

        {/* Resume saved game */}
        {savedGameExists && (
          <motion.div
            className="game-card p-6 mb-6 text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <h3 className="font-display font-bold text-lg mb-2">{t('resumeGame')}</h3>
            <p className="text-muted-foreground text-sm mb-4 font-body">{t('resumeQuestion')}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onResume} variant="default">
                {t('resume')}
              </Button>
              <Button onClick={() => {}} variant="outline">
                {t('newGame')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Setup form */}
        <div className="game-card p-6 space-y-6">
          <h2 className="text-xl font-display font-bold text-center">{t('setup')}</h2>

          {/* Language toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="font-body">{t('language')}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === 'he' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLanguageChange('he')}
              >
                עברית
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLanguageChange('en')}
              >
                English
              </Button>
            </div>
          </div>

          {/* Team names */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <span className="w-4 h-5 pawn-blue rounded-t-full rounded-b-sm" />
              {t('team1')}
            </h3>
            <Input
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              placeholder={t('team1Default')}
              className="text-lg"
            />
            
            <h3 className="font-display font-semibold flex items-center gap-2">
              <span className="w-4 h-5 pawn-red rounded-t-full rounded-b-sm" />
              {t('team2')}
            </h3>
            <Input
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              placeholder={t('team2Default')}
              className="text-lg"
            />
          </div>

          {/* Turn duration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <Label className="font-body">{t('turnDuration')}</Label>
            </div>
            <RadioGroup
              value={String(turnDuration)}
              onValueChange={(v) => setTurnDuration(Number(v))}
              className="flex gap-4"
            >
              {[30, 60, 90].map((sec) => (
                <div key={sec} className="flex items-center gap-2">
                  <RadioGroupItem value={String(sec)} id={`dur-${sec}`} />
                  <Label htmlFor={`dur-${sec}`} className="font-body cursor-pointer">
                    {sec}s
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Allow negative movement */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
              <Label className="font-body cursor-pointer">{t('allowNegative')}</Label>
            </div>
            <Switch
              checked={allowNegative}
              onCheckedChange={setAllowNegative}
            />
          </div>

          {/* Start button */}
          <Button
            onClick={handleStart}
            className="w-full py-6 text-xl font-display bg-gradient-to-r from-primary to-accent hover:opacity-90"
            size="lg"
          >
            {t('startGame')} 🎮
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupScreen;
