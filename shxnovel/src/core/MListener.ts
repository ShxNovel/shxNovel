type EventCallback = (...args: any[]) => any;

class MListener {
    pool: Map<string, EventCallback[]>;

    constructor() {
        this.pool = new Map();
    }

    on(event: string, fn: EventCallback): this {
        if (typeof event !== 'string') {
            return this;
        }
        const handlers = this.pool.get(event);
        if (handlers) {
            handlers.push(fn);
        } else {
            this.pool.set(event, [fn]);
        }
        return this;
    }

    off(event: string, fn?: EventCallback): this {
        if (typeof event !== 'string') {
            return this;
        }
        if (!fn) {
            this.pool.delete(event);
            return this;
        }
        const handlers = this.pool.get(event);
        if (!handlers) {
            return this;
        }
        const index = handlers.indexOf(fn);
        if (index > -1) {
            handlers.splice(index, 1);
            if (handlers.length === 0) {
                this.pool.delete(event);
            }
        }
        return this;
    }

    once(event: string, fn: EventCallback): this {
        const wrapper: EventCallback = (...args: any[]) => {
            this.off(event, wrapper);
            fn(...args);
        };
        return this.on(event, wrapper);
    }

    emit(event: string, ...args: any[]): void {
        if (typeof event !== 'string') {
            return;
        }
        const handlers = this.pool.get(event);
        if (!handlers) {
            return;
        }
        for (const fn of handlers) {
            fn(...args);
        }
    }

    async emitAsync(event: string, ...args: any[]): Promise<void> {
        if (typeof event !== 'string') {
            return;
        }
        const handlers = this.pool.get(event);
        if (!handlers) {
            return;
        }
        for (const fn of handlers) {
            await fn(...args);
        }
    }

    clear(): void {
        this.pool.clear();
    }

    listenerCount(event: string): number {
        if (typeof event !== 'string') {
            return 0;
        }
        return this.pool.get(event)?.length ?? 0;
    }
}

const eventController = new MListener();
export { MListener, eventController };
