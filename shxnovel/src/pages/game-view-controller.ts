import { ReactiveController, ReactiveControllerHost } from 'lit';
import { runtime } from '@shxnovel/canoe';
import { GameDialogue } from '../components/game/game-dialogue';
import { logger } from '@shxnovel/canoe/logger.js';

export interface GameViewHost extends ReactiveControllerHost, HTMLElement {
    dialogue: GameDialogue;
}

export class GameViewController implements ReactiveController {
    host: GameViewHost;

    public uiHidden = false;
    public isAuto = false;
    public isFast = false;

    constructor(host: GameViewHost) {
        this.host = host;
        host.addController(this);
    }

    hostConnected() {
        this.host.addEventListener('wheel', this.handleWheel);
        this.host.addEventListener('contextmenu', this.handleContextMenu);
        this.host.addEventListener('click', this.handleUserClick);
    }

    hostDisconnected() {
        this.host.removeEventListener('wheel', this.handleWheel);
        this.host.removeEventListener('contextmenu', this.handleContextMenu);
        this.host.removeEventListener('click', this.handleUserClick);
    }

    get gameContext() {
        return {
            isAuto: this.isAuto,
            isFast: this.isFast,
            toggleAuto: () => this.toggleAuto(),
            toggleFast: () => this.toggleFast(),
            stopAuto: () => this.stopAuto(),
        };
    }

    // --- Core Logic ---

    public toggleAuto() {
        this.isAuto = !this.isAuto;
        if (this.isAuto) {
            this.isFast = false;
            logger.info('Auto Mode: ON');
        } else {
            logger.info('Auto Mode: OFF');
        }
        this.host.requestUpdate();
    }

    public toggleFast() {
        this.isFast = !this.isFast;
        if (this.isFast) {
            this.isAuto = false;
            logger.info('Fast Mode: ON');
        } else {
            logger.info('Fast Mode: OFF');
        }
        this.host.requestUpdate();
    }

    public stopAuto() {
        if (this.isAuto || this.isFast) {
            this.isAuto = false;
            this.isFast = false;
            logger.info('Auto/Fast Stopped');
            this.host.requestUpdate();
        }
    }

    public toggleUI() {
        this.uiHidden = !this.uiHidden;
        this.host.requestUpdate();
    }

    // --- Event Handlers ---

    private handleWheel = (e: WheelEvent) => {
        if (e.deltaY > 0) {
            this.handleUserClick();
        } else if (e.deltaY < 0) {
            console.log('TODO: Open Backlog');
        }
    };

    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        if (!this.uiHidden) {
            this.uiHidden = true;
            this.host.requestUpdate();
        }
    };

    public handleUserClick = () => {
        if (this.uiHidden) {
            this.uiHidden = false;
            this.host.requestUpdate();
            return;
        }

        this.stopAuto();

        const dialogue = this.host.dialogue;
        if (dialogue && dialogue.isTyping) {
            dialogue.finish();
            return;
        }

        const state = runtime.getState();
        if (state === 'paused' || state === 'ready') {
            runtime.resume();
        }
    };

    // Toolbar actions
    public stopProp = (e: Event) => e.stopPropagation();

    public onToggle = (e: Event) => {
        this.stopProp(e);
        this.toggleUI();
    };

    public onAuto = (e: Event) => {
        this.stopProp(e);
        this.toggleAuto();
    };

    public onFast = (e: Event) => {
        this.stopProp(e);
        this.toggleFast();
    };

    public onBacklog = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Open Backlog');
    };

    public onSave = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Save Game');
    };

    public onReplay = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Replay Voice');
    };

    public onQSave = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Quick Save');
    };
}
