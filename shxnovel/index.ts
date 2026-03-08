import { solveResize } from './src/core';
import { GameStorage } from '@shxnovel/canoe';

solveResize();

GameStorage.save = async (saveId, data) => {
    console.log('Saving game data:', { saveId, data });
    return Promise.resolve();
};

GameStorage.load = async (saveId) => {
    console.log('Loading game data:', { saveId });
    return Promise.resolve({});
};
