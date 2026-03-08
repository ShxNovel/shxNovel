import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { GameStorage, GameSession, SessionState, canoeMachine, GameLauncher } from '@shxnovel/canoe';
import { askConfirm } from '../../core';
import { Router } from '@vaadin/router';

// @ts-ignore
import inlineStyles from './game-save-ui.css?inline';
import { TextOp } from '@shxnovel/schema';

type SaveMode = 'save' | 'load';

@customElement('game-save-ui')
export class GameSaveUI extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    @property() mode: SaveMode = 'save';
    @property({ type: Boolean }) isMainMenu = false;

    @state() private _slots: { id: string; data: SessionState | null }[] = [];

    connectedCallback() {
        super.connectedCallback();
        this._loadSlots();
    }

    private async _loadSlots() {
        const slots = [];
        // 默认显示 12 个存档位
        for (let i = 1; i <= 12; i++) {
            const id = `slot-${i}`;
            const data = await GameStorage.load(id);
            slots.push({ id, data });
        }
        this._slots = slots;
    }

    private _close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    private async _handleSlotClick(slotId: string, hasData: boolean) {
        if (this.mode === 'save') {
            const msg = hasData ? '该位置已有存档，是否覆盖？' : '确定要保存到这个位置吗？';
            const ok = await askConfirm(msg, '保存游戏');
            if (ok) {
                const snapshot = await GameSession.capture();
                await GameStorage.save(slotId, snapshot);
                await this._loadSlots(); // 刷新
            }
        } else {
            if (!hasData) return;
            const ok = await askConfirm('确定要读取这个存档吗？当前进度将丢失。', '读取游戏');
            if (ok) {
                if (this.isMainMenu) {
                    // 主菜单读档逻辑：抛出意图并跳转路由
                    GameLauncher.launch({ type: 'load', saveId: slotId });
                    Router.go('/game');
                } else {
                    // 游戏内读档逻辑：直接恢复并跳转自动机
                    const data = await GameStorage.load(slotId);
                    if (data) {
                        await GameSession.restore(data);
                        // 读档后强制重播当前行，并关闭 UI
                        await canoeMachine.goto(data.chapter, data.index);
                        this._close();
                    }
                }
            }
        }
    }

    private _extractRawText(content: TextOp[]): string {
        if (!content) return '无文本信息';
        if (typeof content === 'string') return content;
        if (!Array.isArray(content)) return '';
        return content.map(c => typeof c === 'string' ? c : (c.kind === 'fast' ? c.text : '')).join('');
    }

    render() {
        return html`
            <div class="header">
                <div class="tabs">
                    ${!this.isMainMenu ? html`
                        <div class="tab ${this.mode === 'save' ? 'active' : ''}" @click=${() => this.mode = 'save'}>SAVE</div>
                    ` : ''}
                    <div class="tab ${this.mode === 'load' ? 'active' : ''}" @click=${() => this.mode = 'load'}>LOAD</div>
                </div>
                <button class="close-btn" @click=${this._close}>返回游戏</button>
            </div>

            <div class="slots-grid">
                ${repeat(this._slots, (s) => s.id, (slot) => html`
                    <div class="slot ${!slot.data ? 'empty' : ''}" @click=${() => this._handleSlotClick(slot.id, !!slot.data)}>
                        <div class="slot-id">${slot.id.replace('slot-', '')}</div>
                        
                        ${slot.data ? html`
                            <div class="slot-thumb">
                                <!-- 占位图，未来可以实现截图功能 -->
                                ${slot.data.chapter}:${slot.data.index}
                            </div>
                            <div class="slot-info">
                                <div class="slot-text">${this._extractRawText(slot.data.lastText?.content)}</div>
                                <div class="slot-date">
                                    ${new Date(slot.data.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ` : html`
                            <div class="empty-hint">Empty Slot</div>
                        `}
                    </div>
                `)}
            </div>
        `;
    }
}
