import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

document.addEventListener('keydown', async function (event) {
    if (isTauri()) return await keydown_Tauri(event);
});

async function keydown_Tauri(event: KeyboardEvent) {
    const appWebview = getCurrentWindow();

    if (event.key === 'F11') {
        event.preventDefault();
        let isF = await appWebview.isFullscreen();
        await appWebview.setFullscreen(!isF);
    } else if (event.key === 'Escape') {
        // await getCurrentWindow().setSkipTaskbar(false);
        // await getCurrentWindow().minimize();
    }
}
