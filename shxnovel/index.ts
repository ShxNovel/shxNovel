import { solveResize } from './src/core';
import { GameStorage } from '@shxnovel/canoe';
import { AppStorageDriver } from './src/core/system/storage-driver';

solveResize();

// 初始化存档驱动
GameStorage.setDriver(new AppStorageDriver());
