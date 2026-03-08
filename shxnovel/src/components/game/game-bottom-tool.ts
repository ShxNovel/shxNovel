import { LitElement, html, css, unsafeCSS, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { consume } from '@lit/context';

// @ts-ignore
import inlineStyles from './game-bottom-tool.css?inline';
import { gameContext, GameContextType } from '../../context/game-context';

@customElement('game-bottom-tool')
export class GameBottomTool extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    @consume({ context: gameContext, subscribe: true })
    @state()
    private _gameContext!: GameContextType;

    _hook_replay = () => {
        this.dispatchEvent(new CustomEvent('replay'));
    };

    _hook_backlog = () => {
        this.dispatchEvent(new CustomEvent('backlog'));
    };

    _hook_toggle = () => {
        this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, composed: true }));
    };

    _hook_auto = () => {
        this.dispatchEvent(new CustomEvent('auto'));
    }

    _hook_fast = () => {
        this.dispatchEvent(new CustomEvent('fast'));
    }

    _hook_qsave = () => {
        this.dispatchEvent(new CustomEvent('qsave'));
    }

    _hook_save = () => {
        this.dispatchEvent(new CustomEvent('save'));
    }

    render() {
        // Fallback if context is not yet available (though it should be)
        const isAuto = this._gameContext?.isAuto || false;
        const isFast = this._gameContext?.isFast || false;

        const autoClasses = { tool_btn: true, active: isAuto };
        const fastClasses = { tool_btn: true, active: isFast };

        return html` <div class="tools">
            <button class=${classMap(autoClasses)} id="btn_auto" @click=${this._hook_auto}>${AutoSvg}Auto</button>
            <button class=${classMap(fastClasses)} id="btn_fast" @click=${this._hook_fast}>${FastSvg}Fast</button>
            <button class="tool_btn" id="btn_replay" @click=${this._hook_replay}>Replay</button>
            <button class="tool_btn" id="btn_backlog" @click=${this._hook_backlog}>${ResetSvg}Backlog</button>
            <button class="tool_btn" id="btn_q_save" @click=${this._hook_qsave}>Q.save</button>
            <button class="tool_btn" id="btn_save" @click=${this._hook_save}>${QSaveSvg}Save</button>
            <button class="tool_btn" id="btn_hide" @click=${this._hook_toggle}>${HideSvg}</button>
        </div>`;
    }
}

const AutoSvg = html`<svg
    t="1706550390437"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="4337"
    width="48"
    height="48"
>
    <path d="M596 359.008l160 128-39.968 49.984-160-128 39.968-49.984z" fill="#2c3e50" p-id="4338"></path>
    <path d="M480 672l-480 0 0-320 480 0 0 64-416 0 0 192 416 0z" fill="#2c3e50" p-id="4339"></path>
    <path
        d="M416 995.232l0-259.232 64 0 0 124.768 429.248-348.768-429.248-348.768 0 124.768-64 0 0-259.232 594.752 483.232z"
        fill="#2c3e50"
        p-id="4340"
    ></path>
</svg>`;

const FastSvg = html`<svg
    t="1706550653890"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="1755"
    width="200"
    height="200"
>
    <path
        d="M269.223 905.85a15.997 15.997 0 0 1-12.61 6.15h-87.59c-6.67 0.01-10.42-7.68-6.31-12.93l301.93-386.44-302.93-387.7c-4.11-5.25-0.36-12.94 6.31-12.93h89.56c4.93 0 9.58 2.27 12.61 6.15l291.85 373.52c9.04 11.58 9.04 27.82 0 39.4l-292.82 374.78z m295 0a15.997 15.997 0 0 1-12.61 6.15h-87.59c-6.67 0.01-10.42-7.68-6.31-12.93l301.93-386.44-302.93-387.7c-4.11-5.25-0.36-12.94 6.31-12.93h89.56c4.93 0 9.58 2.27 12.61 6.15l291.85 373.52c9.04 11.58 9.04 27.82 0 39.4l-292.82 374.78z"
        p-id="1756"
        fill="#2c3e50"
    ></path>
</svg>`;

const ResetSvg = html` <svg
    t="1706551128723"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="2165"
    width="200"
    height="200"
>
    <path
        d="M880 512c0-129.794-67.195-243.894-168.697-309.41-8.881-5.733-10.588-18.274-3.114-25.748l34.376-34.376c5.296-5.296 13.577-6.234 19.785-2.043C881.592 220.92 960 357.303 960 512c0 247.424-200.576 448-448 448-39.204 0-77.233-5.036-113.473-14.496l137.078-137.078c4.205-4.205 11.365-2.515 13.246 3.127l21.293 63.879C745.757 847.558 880 695.456 880 512zM315.837 847.175c7.475-7.475 5.766-20.017-3.116-25.749C211.206 755.913 144 641.805 144 512c0-162.56 105.404-300.502 251.597-349.21l32.313 96.939c1.88 5.642 9.041 7.332 13.246 3.127L625.507 78.505C589.256 69.039 551.217 64 512 64 264.576 64 64 264.576 64 512c0 154.708 78.419 291.1 197.677 371.595 6.208 4.19 14.488 3.252 19.784-2.044l34.376-34.376z"
        p-id="2166"
    ></path>
</svg>`;

const QSaveSvg = html`<svg
    t="1706551367372"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="2457"
    width="200"
    height="200"
>
    <path
        d="M80 64c-8.84 0-16 7.16-16 16v768c0 8.84 7.16 16 16 16h367.47c-15.23-24.56-27.06-51.44-34.83-80H144V144h640v266.1c28.53 7.55 55.41 19.15 80 34.14V80c0-8.83-7.16-16-16-16H80z m880 640c0 141.38-114.62 256-256 256S448 845.38 448 704s114.62-256 256-256 256 114.62 256 256zM704 888c101.62 0 184-82.38 184-184s-82.38-184-184-184-184 82.38-184 184 82.38 184 184 184z m128-163.999c0 8.84-7.16 16-16 16h-76v76c0 8.84-7.16 16-16 16h-40c-8.84 0-16-7.16-16-16v-76h-76c-8.84 0-16-7.16-16-16v-40c0-8.84 7.16-16 16-16h76v-76c0-8.84 7.16-16 16-16h40c8.84 0 16 7.16 16 16v76h76c8.84 0 16 7.16 16 16v40z"
        p-id="2458"
    ></path>
</svg>`;

const HideSvg = html` <svg
    t="1706550916914"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="2021"
    width="200"
    height="200"
>
    <path
        d="M449.774 512L169.76 231.986a7.997 7.997 0 0 1 0-11.314l50.911-50.911a7.999 7.999 0 0 1 11.314 0l280.014 280.014 280.008-280.008a7.997 7.997 0 0 1 11.314 0l50.911 50.911a7.998 7.998 0 0 1 0 11.313L574.224 512l280.009 280.009a7.999 7.999 0 0 1 0 11.314l-50.912 50.911a7.998 7.998 0 0 1-11.313 0L511.999 574.225 231.984 854.24a7.999 7.999 0 0 1-11.314 0l-50.911-50.912a7.998 7.998 0 0 1 0-11.313L449.774 512z"
        p-id="2022"
    ></path>
</svg>`;
