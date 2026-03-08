import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { LionButton } from '@lion/ui/button.js';

@customElement('vn-button')
export class VnButton extends LionButton {
    static get styles() {
        return [...super.styles, css``];
    }
}
