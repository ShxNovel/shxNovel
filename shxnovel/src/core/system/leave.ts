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
            if (comfirmBox && useConfirmBox) {
                // lion bug
                const dialog = document.querySelector('vn-confirm-dialog') as any;

                if (!dialog) {
                    console.error('no confirm dialog found');
                    return;
                }

                let res = await dialog.ask('是否退出游戏?');
                if (res) await decideExitGame();
            } else {
                await decideExitGame();
            }
        });
    }

    return () => {};
}

const unlisten = await solveClose();

export async function decideExitGame() {
    unlisten();
    const appWebview = getCurrentWindow();
    await eventController.emitAsync('exit');
    await appWebview.destroy();
}
