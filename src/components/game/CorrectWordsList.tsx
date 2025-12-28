import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '@/lib/i18n';
import { CheckCircle2 } from 'lucide-react';

interface CorrectWordsListProps {
    words: Array<{ word: string; number: number }>;
    language: Language;
}

const CorrectWordsList: React.FC<CorrectWordsListProps> = ({ words, language }) => {
    const isRTL = language === 'he';

    if (words.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-success/20 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h3 className="font-display font-bold text-success">
                    {language === 'he' ? 'מילים נכונות' : 'Correct Words'}
                </h3>
            </div>

            <div className="space-y-2 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {words.map((item) => (
                        <motion.div
                            key={`${item.number}-${item.word}`}
                            className="flex items-center gap-3 bg-success/10 rounded-lg p-2 border border-success/20"
                            initial={{ opacity: 0, x: isRTL ? 20 : -20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, height: 0, marginBottom: 0, padding: 0 }}
                            transition={{ duration: 0.2 }}
                            layout
                        >
                            <span className="w-7 h-7 rounded-full bg-success text-success-foreground flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                                {item.number}
                            </span>
                            <span className={`font-body text-sm flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {item.word}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CorrectWordsList;
