import { LitElement, PropertyValues, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Router, Commands } from '@vaadin/router';

// @ts-ignore
import inlineStyles from './logo-view.css?inline';
import { createTimeline } from 'animejs';

@customElement('logo-view')
export class LogoView extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    firstUpdated() {
        const q = (name: string) => {
            return this.shadowRoot!.querySelectorAll(name);
        };

        const tl = createTimeline({
            onComplete: () => {
                Router.go('/menu');
            },
        });

        tl.add({ duration: 500 });

        tl.add(q('.ml5 .line'), {
            opacity: { from: 0.5, to: 1 },
            scaleX: { from: 0, to: 1 },
            ease: 'inOutQuad',
            duration: 700,
        });

        tl.add(q('.ml5 .line'), {
            translateY: (_el: any, i: number) => -0.625 + 0.625 * 2 * i + 'em',
            duration: 600,
            ease: 'outExpo',
        });

        tl.add(
            q('.ml5 .ampersand'),
            {
                opacity: { from: 0, to: 1 },
                scaleY: { from: 0.5, to: 1 },
                ease: 'outExpo',
                duration: 600,
            },
            '-=600'
        );

        tl.add(
            q('.ml5 .letters-left'),
            {
                opacity: { from: 0, to: 1 },
                translateX: { from: '0.5em', to: 0 },
                ease: 'outExpo',
                duration: 600,
            },
            '-=300'
        );

        tl.add(
            q('.ml5 .letters-right'),
            {
                opacity: { from: 0, to: 1 },
                translateX: { from: '-0.5em', to: 0 },
                ease: 'outExpo',
                duration: 600,
            },
            '-=600'
        );

        tl.add(q('.ml5'), {
            opacity: 0,
            duration: 1000,
            ease: 'outExpo',
            delay: 1000,
        });

        tl.play();
    }

    render() {
        return html`
            <div class="boxout">
                <h1 class="ml5">
                    <span class="text-wrapper">
                        <span class="line line1"></span>
                        <span class="letters letters-left">Nuist</span>
                        <span class="letters ampersand">with</span>
                        <span class="letters letters-right">GalGame💞</span>
                        <span class="line line2"></span>
                    </span>
                </h1>
            </div>
        `;
    }
}
