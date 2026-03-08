import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '@lion/ui/define/lion-dialog.js';

// @ts-ignore
import inlineStyles from './game-top-menu.css?inline';
import { Router } from '@vaadin/router';

@customElement('game-top-menu')
export class GameTopMenu extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    // 我们依然需要这个状态来控制“外部按钮”的样式（比如让它变成 X，或者隐藏）
    // Lion 会通过 @opened-changed 告诉我们当前状态
    @state() private _opened = false;

    private _onOpenedChanged(e: CustomEvent) {
        this._opened = e.detail.opened;
    }

    // 核心：点击内部按钮时调用的函数
    _closeDialog(e: Event) {
        // 向上传递 'close-overlay' 事件，Lion 收到后会自动关闭
        e.target?.dispatchEvent(new Event('close-overlay', { bubbles: true }));
    }

    render() {
        const outerBarsClasses = { bars: true, hidden: this._opened, change: this._opened };
        const innerBarsClasses = { bars: true, change: true };
        const navClasses = { nav: true, change: this._opened };
        const bgClasses = { 'change-bg': this._opened };

        return html`
            <lion-dialog @opened-changed=${this._onOpenedChanged}>
                <div slot="invoker">
                    <button class=${classMap(outerBarsClasses)}>
                        <div class="bar" id="bar-1"></div>
                        <div class="bar" id="bar-2"></div>
                        <div class="bar" id="bar-3"></div>
                    </button>
                </div>

                <div slot="content" class="menu-content-wrapper">
                    <div id="menu-bg" class=${classMap(bgClasses)}></div>

                    <button class=${classMap(innerBarsClasses)} @click=${this._closeDialog}>
                        <div class="bar" id="bar-1" @click=${this._closeDialog}></div>
                        <div class="bar" id="bar-2" @click=${this._closeDialog}></div>
                        <div class="bar" id="bar-3" @click=${this._closeDialog}></div>
                    </button>

                    <nav class=${classMap(navClasses)}>
                        <ul>
                            <li><button autofocus class="menu-item" href="./options.html">选项菜单</button></li>
                            <li><button class="menu-item" href="#">游戏存档</button></li>
                            <li><button class="menu-item" href="./gallery.html">鉴赏系统</button></li>
                            <li><button class="menu-item" @click=${() => Router.go('/menu')}>标题界面</button></li>
                        </ul>
                    </nav>
                </div>
            </lion-dialog>

            <style>
                :host {
                    --lion-dialog-backdrop-background-color: transparent;
                }
            </style>
        `;
    }
}
