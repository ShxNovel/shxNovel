import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { HistoryManager, GameSession, SessionState } from '@shxnovel/canoe';

// @ts-ignore
import inlineStyles from './game-backlog.css?inline';
import { TextOp } from '@shxnovel/schema';

@customElement('game-backlog')
export class GameBacklog extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    @state()
    private _logs: SessionState[] = [];

    connectedCallback() {
        super.connectedCallback();
        // 获取当前历史
        this._logs = HistoryManager.getStack();
        console.log('[Backlog] Current history stack:', this._logs);

        // 自动滚动到底部
        setTimeout(() => {
            const content = this.renderRoot.querySelector('.content');
            if (content) content.scrollTop = content.scrollHeight;
        }, 50);
    }

    private _close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    private async _jumpTo(state: SessionState) {
        const confirmed = confirm('是否要跳回到这段剧情？');
        if (confirmed) {
            // 关键：使用 jumpBackTo 确保历史栈被同步截断
            await HistoryManager.jumpBackTo(state);
            this._close();
        }
    }

    render() {
        return html`
            <div class="header">
                <h2>剧情回顾 (Backlog)</h2>
                <button class="close-btn" @click=${this._close}>关闭 (ESC)</button>
            </div>
            <div class="content">
                ${repeat(this._logs, (log, idx) => `${log.chapter}-${log.index}-${idx}`, (log) => {
                    const textData = log.lastText;

                    if (!textData) {
                        console.warn('[Backlog] Found history item without textData:', log);
                        return html``;
                    }

                    return html`
                        <div class="log-item" @click=${() => this._jumpTo(log)}>
                            <div class="speaker">${textData.name || '旁白'}</div>
                            <div class="text">${this._extractRawText(textData.content)}</div>
                        </div>
                    `;
                })}
                ${this._logs.length === 0 ? html`<div style="text-align:center; padding: 4rem; opacity: 0.5;">暂无历史记录</div>` : ''}
            </div>
        `;
    }

    /**
     * 将 TextOp[] 转换为纯文本显示
     */
    private _extractRawText(content: TextOp[]): string {
        if (!content) return '';
        if (typeof content === 'string') return content;
        if (!Array.isArray(content)) return '';

        return content.map(c => {
            if (typeof c === 'string') return c;
            if (c && c.kind === 'fast') return c.text || '';
            return '';
        }).join('');
    }
}
