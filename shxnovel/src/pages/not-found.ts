import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

// @ts-ignore
import inlineStyles from './not-found.css?inline';

@customElement('not-found')
export class NotFound extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    @state()
    private _missingPath: string = window.location.pathname;

    @state()
    private _countdown: number = 5;

    private _timer?: number;

    connectedCallback() {
        super.connectedCallback();
        this._timer = window.setInterval(() => {
            this._countdown--;
            if (this._countdown <= 0) {
                this._goHome();
            }
        }, 1000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._timer) {
            clearInterval(this._timer);
        }
    }

    render() {
        return html`
            <div class="container">
                <h1>FATAL_ERROR</h1>

                <div class="error-code">
                    <p>> ERROR_CODE: 0x00000404</p>
                    <p>> CONTEXT: PAGE_NOT_FOUND_EXCEPTION</p>
                    <p>> TARGET: "${this._missingPath}"</p>
                </div>

                <div class="stack-trace">
                    <p>*** STOP: 0x00000000 (0xF0000000, 0x00000000, 0x00000000)</p>
                    <p>System halted due to unrecoverable navigation error.</p>
                    <p class="blink">_</p>
                </div>

                <div class="auto-reboot">> SYSTEM RECOVERY INITIATED... REBOOT IN [ ${this._countdown} ]</div>
                <!-- <div class="actions">
                    <button @click=${this._goHome}>[ REBOOT NOW ]</button>
                </div> -->
            </div>
        `;
    }

    private _goHome() {
        Router.go('/menu');
    }
}
