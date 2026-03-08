import { LitElement, html, css, unsafeCSS, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import '../components/vn-tabs';
import '@lion/ui/define/lion-switch.js';
import '@lion/ui/define/lion-switch.js';
import '@lion/ui/define/lion-select.js';
import '@lion/ui/define/lion-listbox.js';

// @ts-ignore
import inlineStyles from './game-setting.css?inline';
import { goBackOrFallback } from '../core';

@customElement('game-setting')
export class GameSetting extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    render() {
        return html`
            <div class="container">
                <div class="header">
                    <h1>CONFIG</h1>
                    <button class="back-btn" @click=${() => goBackOrFallback('/menu')}>返回前一页</button>
                </div>

                <vn-tabs>
                    <button slot="tab">显示 Graphics</button>
                    <div slot="panel">
                        <div class="control-row">
                            <span class="label">显示模式</span>
                            <lion-select label="" label-sr-only>
                                <select slot="input">
                                    <option value="window">窗口模式</option>
                                    <option value="fullscreen">全屏模式</option>
                                    <option value="borderless">无边框窗口</option>
                                </select>
                            </lion-select>
                        </div>

                        <div class="control-row">
                            <span class="label">垂直同步 (V-Sync)</span>
                            <lion-switch checked></lion-switch>
                        </div>

                        <div class="control-row">
                            <span class="label">界面缩放</span>
                            <input type="range" min="0.8" max="1.5" step="0.1" value="1.0" />
                        </div>
                    </div>

                    <button slot="tab">音频 Audio</button>
                    <div slot="panel">
                        <div class="control-row">
                            <span class="label">主音量 (Master)</span>
                            <input type="range" value="80" />
                        </div>

                        <div class="control-row">
                            <span class="label">背景音乐 (BGM)</span>
                            <input type="range" value="60" />
                        </div>

                        <div class="control-row">
                            <span class="label">语音 (Voice)</span>
                            <input type="range" value="100" />
                        </div>

                        <div class="control-row">
                            <span class="label">音效 (SE)</span>
                            <input type="range" value="70" />
                        </div>
                    </div>

                    <button slot="tab">系统 System</button>
                    <div slot="panel">
                        <div class="control-row">
                            <span class="label">文字显示速度</span>
                            <input type="range" min="1" max="100" value="50" />
                        </div>

                        <div class="control-row">
                            <span class="label">跳过未读文本</span>
                            <lion-switch help-text="警告：可能会剧透"></lion-switch>
                        </div>

                        <div class="control-row">
                            <span class="label">自动存档间隔</span>
                            <lion-select label="" label-sr-only>
                                <select slot="input">
                                    <option value="off">关闭</option>
                                    <option value="5">每 5 分钟</option>
                                    <option value="15">每 15 分钟</option>
                                </select>
                            </lion-select>
                        </div>
                    </div>
                </vn-tabs>
            </div>
        `;
    }
}
