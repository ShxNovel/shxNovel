import { TauriEvent } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { eventController } from '../MListener';
import { isTauri } from '@tauri-apps/api/core';

type ConfirmBox = Element & { ask: (message: string, title?: string) => Promise<any> };

let comfirmBox: undefined | ConfirmBox;

let useConfirmBox = true;
export function initConfirmBox(ele: ConfirmBox) {
    comfirmBox = ele;
}

export async function askConfirm(message: string, title?: string): Promise<boolean> {
    const dialog = document.querySelector('vn-confirm-dialog') as any;
    if (!dialog) {
        console.warn('[askConfirm] vn-confirm-dialog not found in DOM, falling back to native confirm.');
        return confirm(message);
    }
    return await dialog.ask(message, title);
}

export function setConfirmBoxActiveStatus(ok = true) {
    useConfirmBox = ok;
}

export async function tryExitGame() {
    const appWebview = getCurrentWindow();
    await appWebview.close();
}

async function solveClose() {
    if (isTauri()) {
        const appWebview = getCurrentWindow();
        return await appWebview.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, async () => {
            if (useConfirmBox) {
                let res = await askConfirm('是否退出游戏?');
                if (res) await decideExitGame();
            } else {
                await decideExitGame();
            }
        });
    }

    return () => { };
}

const unlisten = await solveClose();

export async function decideExitGame() {
    unlisten();
    const appWebview = getCurrentWindow();
    await eventController.emitAsync('exit');
    await appWebview.destroy();
}
