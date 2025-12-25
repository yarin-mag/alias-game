import React from 'react';
import { motion } from 'framer-motion';
import { Team, getDigitAtPosition } from '@/lib/gameLogic';
import { Language, useTranslation } from '@/lib/i18n';

interface TeamHeaderProps {
  teams: [Team, Team];
  currentTeamIndex: 0 | 1;
  language: Language;
}

const TeamHeader: React.FC<TeamHeaderProps> = ({ teams, currentTeamIndex, language }) => {
  const t = useTranslation(language);
  const isRTL = language === 'he';

  return (
    <div className="flex justify-between items-center gap-4 w-full max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {teams.map((team, index) => {
        const isActive = index === currentTeamIndex;
        const wordNumber = getDigitAtPosition(team.position);
        
        return (
          <motion.div
            key={index}
            className={`
              flex-1 game-card p-4 transition-all duration-300
              ${isActive ? 'ring-4 ring-offset-2 ring-offset-background' : 'opacity-70'}
              ${team.color === 'blue' ? 'ring-team-blue' : 'ring-team-red'}
            `}
            animate={isActive ? { scale: 1.02 } : { scale: 1 }}
          >
            <div className="flex items-center gap-3">
              {/* Pawn indicator */}
              <div 
                className={`
                  w-8 h-10 rounded-t-full rounded-b-lg
                  ${team.color === 'blue' ? 'pawn-blue' : 'pawn-red'}
                `}
              />
              
              <div className="flex-1">
                <h3 className={`
                  font-display font-bold text-lg
                  ${team.color === 'blue' ? 'text-team-blue' : 'text-team-red'}
                `}>
                  {team.name}
                </h3>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
                  <span>{t('position')}: <strong className="text-foreground">{team.position}</strong></span>
                  <span>•</span>
                  <span>{t('wordNumber')}: <strong className="text-primary">{wordNumber}</strong></span>
                </div>
              </div>
              
              {isActive && (
                <motion.div
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-display"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {t('turn')} ⭐
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TeamHeader;
