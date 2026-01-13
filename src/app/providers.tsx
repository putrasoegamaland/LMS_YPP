'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { GameProvider } from '@/contexts/GameContext';
import { AIHintProvider } from '@/contexts/AIHintContext';
import { IntegrityProvider } from '@/contexts/IntegrityContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <GameProvider>
                    <AIHintProvider>
                        <IntegrityProvider>
                            {children}
                        </IntegrityProvider>
                    </AIHintProvider>
                </GameProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
