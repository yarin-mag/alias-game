import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    showHomeButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showHomeButton = true }) => {
    const navigate = useNavigate();

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo/Brand */}
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Gamepad2 className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-2xl font-display font-bold text-primary">
                        Alias
                    </h1>
                </div>

                {/* Navigation */}
                {showHomeButton && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/room')}
                        className="flex items-center gap-2 hover:bg-primary/10"
                    >
                        <Home className="w-4 h-4" />
                        <span className="hidden sm:inline">Home</span>
                    </Button>
                )}
            </div>
        </motion.header>
    );
};

export default Header;
