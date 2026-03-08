import { LitElement, html, css, unsafeCSS, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js'; // 引入 classMap

import '@lion/ui/define/lion-dialog.js';
import '@lion/ui/define/lion-button.js';
import '../components/vn-button';

// @ts-ignore
import logoStyles from './vn-confirm-dialog.css?inline';
import { initConfirmBox } from '../core';

@customElement('vn-confirm-dialog')
export class VnConfirmDialog extends LitElement {
    static styles = [unsafeCSS(logoStyles)];

    @property({ type: String }) titleText = '提示';
    @property({ type: String }) confirmText = '确定';
    @property({ type: String }) cancelText = '取消';

    // 控制 Lion Dialog 是否存在于 DOM 中
    @state() private _open = false;
    // 新增：控制是否正在播放关闭动画
    @state() private _closing = false;

    @state() private _message = '';

    private _resolve: ((value: boolean) => void) | null = null;

    async ask(message: string, title?: string): Promise<boolean> {
        this._message = message;
        if (title) this.titleText = title;

        // 确保之前的关闭状态被重置
        this._closing = false;
        await this.updateComplete;
        this._open = true; // Lion 将元素插入 DOM

        return new Promise<boolean>((resolve) => {
            if (this._resolve) this._resolve(false);
            this._resolve = resolve;
        });
    }

    private _handleConfirm() {
        this._startClosingAnimation(true);
    }
    private _handleCancel() {
        this._startClosingAnimation(false);
    }

    /**
     * 核心修改：带有动画延时的关闭流程
     */
    private async _startClosingAnimation(result: boolean) {
        // 1. 设置关闭状态，触发 CSS 中的退场动画
        this._closing = true;

        // 2. 等待动画播放完毕 (必须与 CSS 中的 animation-duration 匹配: 0.3s)
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 3. 动画播完后，真正的关闭弹窗 (Lion 移除 DOM)
        this._close(result);

        // 4. 重置状态以备下次使用
        this._closing = false;
    }

    private _close(result: boolean) {
        this._open = false;
        if (this._resolve) {
            this._resolve(result);
            this._resolve = null;
        }
    }

    // 处理意外关闭（如ESC键），也需要走动画流程
    private _onOpenedChanged(e: CustomEvent) {
        if (e.detail.opened === false && this._open === true && !this._closing) {
            // 如果 Lion 试图关闭它（例如用户按了 ESC），我们拦截它
            // 重新设置为 true，然后手动启动我们的关闭流程
            this._open = true;
            this._startClosingAnimation(false);
        } else {
            // 正常状态同步
            this._open = e.detail.opened;
        }
    }

    connectedCallback(): void {
        super.connectedCallback();
        initConfirmBox(this);
    }

    render() {
        // 使用 classMap 动态管理动画状态类
        const wrapperClasses = {
            'dialog-wrapper': true,
            'is-open': this._open, // 进入 DOM 后应用进场动画
            'is-closing': this._closing, // 点击关闭后应用退场动画
        };

        return html`
            <lion-dialog .opened=${this._open} @opened-changed=${this._onOpenedChanged}>
                <div slot="content" class=${classMap(wrapperClasses)}>
                    <div class="custom-backdrop" @click=${this._handleCancel}></div>

                    <div class="dialog-frame">
                        <div class="title">${this.titleText}</div>
                        <div class="content-text">${this._message}</div>

                        <div class="actions">
                            <vn-button class="btn-cancel" @click=${this._handleCancel}> ${this.cancelText} </vn-button>
                            <vn-button class="btn-confirm" @click=${this._handleConfirm}>
                                ${this.confirmText}
                            </vn-button>
                        </div>
                    </div>
                </div>
            </lion-dialog>
        `;
    }
}
