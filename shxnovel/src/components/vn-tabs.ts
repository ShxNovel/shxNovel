import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { LionTabs } from '@lion/ui/tabs.js';

@customElement('vn-tabs')
export class VnTabs extends LionTabs {
    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: flex;
                    flex-direction: row;
                    height: 100%;
                    overflow: hidden;
                }

                .tabs__tab-group {
                    display: block;
                }

                .tabs__panels {
                    flex: 1; /* 占满剩余宽度 */
                    height: 100%;
                    overflow: hidden; /* 内部交给 panel 自己滚动 */
                    display: block;
                }

                .tabs__atom {
                    display: none;
                }
            `,
        ];
    }
}
