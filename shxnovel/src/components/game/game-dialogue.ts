import { LitElement, html, css, unsafeCSS, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

// @ts-ignore
import Typewriter from 'typewriter-effect/dist/core';
import { TypewriterState, TypewriterClass } from 'typewriter-effect';

// @ts-ignore
import inlineStyles from './game-dialogue.css?inline';

@customElement('game-dialogue')
export class GameDialogue extends LitElement {
    static styles = unsafeCSS(inlineStyles);

    @query('.content') contentElement!: HTMLElement;
    @query('.content_cursor') cursorElement?: HTMLElement;

    @property({ type: Boolean }) useQuote = true;

    instance?: TypewriterClass;
    plainText = '';
    public isTyping = false;

    init() {
        if (this.instance) {
            this.instance.stop();
            this.instance = undefined;
        }

        this.plainText = '';
        this.isTyping = false;

        const one = new Typewriter(this.contentElement, {
            cursor: '...',
            autoStart: false,
            loop: false,
            skipAddStyles: false,
            delay: 30,
            cursorClassName: 'content_cursor',
            wrapperClassName: 'content_html',
            onCreateTextNode: this.customNodeCreator,
        });

        this.instance = one;

        one.callFunction(() => {
            const aim = this.cursorElement;
            if (aim) aim.style.display = 'none';
        });

        if (this.useQuote) {
            this.addText('「 ');
        }

        return one;
    }

    play() {
        if (!this.instance) return;

        this.isTyping = true;

        if (this.useQuote) {
            this.addText(' 」');
        }

        this.instance.callFunction(() => {
            const aim = this.cursorElement;
            if (aim) aim.style.display = 'block';
        });

        this.instance.callFunction(() => {
            this.isTyping = false;
        });

        this.instance.start();
    }

    stop() {
        this.instance?.stop();
        this.isTyping = false;
    }

    finish() {
        if (!this.isTyping) return;

        this.stop(); // Stop the typewriter

        // Manually render the full text
        if (this.contentElement) {
            this.contentElement.innerHTML = ''; // Clear partial text

            // Reconstruct the HTML structure
            const wrapper = document.createElement('span');
            wrapper.className = 'content_html';

            for (const char of this.plainText) {
                if (char === '\n') {
                    wrapper.appendChild(document.createElement('br'));
                } else {
                    const el = document.createElement('span');
                    el.innerHTML = char;
                    el.className = 'contentFadeIn';
                    el.style.animation = 'none';
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                    wrapper.appendChild(el);
                }
            }
            this.contentElement.appendChild(wrapper);

            // Recreate the cursor element since we wiped the innerHTML
            const cursor = document.createElement('span');
            cursor.className = 'content_cursor';
            cursor.innerHTML = '...';
            cursor.style.display = 'block';
            this.contentElement.appendChild(cursor);
        }

        this.isTyping = false;
    }

    addText(s: string) {
        if (!this.instance) return;
        this.instance.typeString(s);
        this.plainText += s;
    }

    addInstantText(s: string) {
        if (!this.instance) return;
        this.instance.pasteString(s, null);
        this.plainText += s;
    }

    addPause(p: number) {
        if (!this.instance) return;
        this.instance.pauseFor(p);
    }

    setSpeed(s: number) {
        if (!this.instance) return;
        this.instance.changeDelay(s);
    }

    addBreakpoint() {
        if (!this.instance) return;
        this.instance.callFunction(() => {
            this.stop();
        });
    }

    addCallback(fn: (state: TypewriterState) => void) {
        if (!this.instance) return;
        this.instance.callFunction(fn);
    }

    customNodeCreator = (character: string): Element => {
        if (character === '\n') {
            return document.createElement('br');
        }
        let el = document.createElement('span');
        el.innerHTML = character;
        el.className = 'contentFadeIn';
        return el;
    };

    firstUpdated() {
        // this.init();
        // this.addText(`嗯——。地底鸦原来是吞噬了八咫乌的力量呢。\n那么强的神明应该能收集到不少信仰呢……\n`);
        // this.addText('果然我家神社的神明也得有点比较体贴明了的恩惠才对');
        // this.play();
    }

    render() {
        return html`<div class="content"></div>`;
    }
}
