import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { GameLauncher } from '@shxnovel/canoe';

// @ts-ignore
import '../components/vn-confirm-dialog';
import { VnConfirmDialog } from '../components/vn-confirm-dialog';

// @ts-ignore
import inlineStyles from './main-menu.css?inline';
import { decideExitGame } from '../core/system';

@customElement('main-menu')
export class MainMenu extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    // 获取组件实例
    @query('vn-confirm-dialog')
    confirmDialog!: VnConfirmDialog;

    async handleExit() {
        // '未保存的进度将会丢失，确定要退出吗？', '退出游戏'
        const isConfirmed = await this.confirmDialog.ask('是否退出游戏');

        if (isConfirmed) {
            await decideExitGame();
        } else {
            // cancel
        }
    }

    continueGame = () => {
        GameLauncher.launch({ type: 'continue' });
        Router.go('/game');
    };

    startFromBeginning = () => {
        GameLauncher.launch({ type: 'new' });
        Router.go('/game');
    };

    render() {
        return html`<main>
            <vn-confirm-dialog></vn-confirm-dialog>

            <h1>FRAGMENTARY</h1>
            <p class="subtitle">—— 那些无法拾起的时光碎片 ——</p>

            <div class="container">
                <div class="btn-rose-wrapper">
                    <button class="btn-rose" @click=${this.continueGame}>继续追忆</button>
                </div>

                <div class="btn-amethyst-wrapper">
                    <button class="btn-amethyst" @click=${this.startFromBeginning}>从头开始</button>
                </div>

                <button class="btn-aqua">
                    <span class="btn-aqua-content">记 录</span>
                </button>

                <button class="btn-aqua">
                    <span class="btn-aqua-content">画 廊</span>
                </button>

                <!-- <button class="btn-moon">
                    <span>画 廊</span>
                </button> -->

                <!-- <button class="btn-sapphire">
                    <span class="btn-sapphire-content">设置</span>
                </button> -->
            </div>

            <div class="bottom">
                <div class="left">
                    <p class="version">demo @BrickSoft</p>
                </div>
                <div class="right">
                    <button class="setting" @click=${() => Router.go('/setting')}>${SettingSvg}</button>
                    <button class="leave" @click=${this.handleExit}>${LeaveSvg}</button>
                </div>
            </div>
        </main>`;
    }
}

const SettingSvg = html` <svg
    t="1769423274717"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="5659"
    width="50"
    height="50"
>
    <path
        d="M919.6 405.6l-57.2-8c-12.7-1.8-23-10.4-28-22.1-11.3-26.7-25.7-51.7-42.9-74.5-7.7-10.2-10-23.5-5.2-35.3l21.7-53.5c6.7-16.4 0.2-35.3-15.2-44.1L669.1 96.6c-15.4-8.9-34.9-5.1-45.8 8.9l-35.4 45.3c-7.9 10.2-20.7 14.9-33.5 13.3-14-1.8-28.3-2.8-42.8-2.8-14.5 0-28.8 1-42.8 2.8-12.8 1.6-25.6-3.1-33.5-13.3l-35.4-45.3c-10.9-14-30.4-17.8-45.8-8.9L230.4 168c-15.4 8.9-21.8 27.7-15.2 44.1l21.7 53.5c4.8 11.9 2.5 25.1-5.2 35.3-17.2 22.8-31.7 47.8-42.9 74.5-5 11.8-15.3 20.4-28 22.1l-57.2 8C86 408 72.9 423 72.9 440.8v142.9c0 17.7 13.1 32.7 30.6 35.2l57.2 8c12.7 1.8 23 10.4 28 22.1 11.3 26.7 25.7 51.7 42.9 74.5 7.7 10.2 10 23.5 5.2 35.3l-21.7 53.5c-6.7 16.4-0.2 35.3 15.2 44.1L354 927.8c15.4 8.9 34.9 5.1 45.8-8.9l35.4-45.3c7.9-10.2 20.7-14.9 33.5-13.3 14 1.8 28.3 2.8 42.8 2.8 14.5 0 28.8-1 42.8-2.8 12.8-1.6 25.6 3.1 33.5 13.3l35.4 45.3c10.9 14 30.4 17.8 45.8 8.9l123.7-71.4c15.4-8.9 21.8-27.7 15.2-44.1l-21.7-53.5c-4.8-11.8-2.5-25.1 5.2-35.3 17.2-22.8 31.7-47.8 42.9-74.5 5-11.8 15.3-20.4 28-22.1l57.2-8c17.6-2.5 30.6-17.5 30.6-35.2V440.8c0.2-17.8-12.9-32.8-30.5-35.2z m-408 245.5c-76.7 0-138.9-62.2-138.9-138.9s62.2-138.9 138.9-138.9 138.9 62.2 138.9 138.9-62.2 138.9-138.9 138.9z"
        fill="#727BA2bb"
        p-id="5660"
    ></path>
</svg>`;

const LeaveSvg = html` <svg
    t="1769423054544"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="2459"
    width="50"
    height="50"
>
    <path
        d="M667.7 100.6H152L426.8 217v551.5h240.8v-222H708v259.7H426.8v153.1L64.2 806.1V63.9H708v297.3h-40.3V100.6z m291.9 352.7l-171 157.6v-102H507.4v-111h281.1V295.8l171.1 157.5z"
        fill="#727BA2"
        p-id="2460"
    ></path>
    <path
        d="M667.7 100.6H152L426.8 217v551.5h240.8v-222H708v259.7H426.8v153.1L64.2 806.1V63.9H708v297.3h-40.3V100.6z m291.9 352.7l-171 157.6v-102H507.4v-111h281.1V295.8l171.1 157.5z"
        fill="#727BA2"
        p-id="2461"
    ></path>
</svg>`;
