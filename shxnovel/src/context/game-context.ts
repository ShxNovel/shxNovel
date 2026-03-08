import { createContext } from '@lit/context';

export interface GameContextType {
    isAuto: boolean;
    isFast: boolean;
    toggleAuto: () => void;
    toggleFast: () => void;
    stopAuto: () => void;
}

export const gameContext = createContext<GameContextType>('game-context');
