import { isFunction } from '../utils/typeCheck';

type Action = boolean | (() => boolean);

class ShxAction {
    actions: Map<number, Action> = new Map();
    actionsUUID = 0;

    get size() {
        return this.actions.size;
    }

    /**
     * Register an action callback
     * @returns {number} action UUID
     */
    add(callback: Action = true): number {
        this.actionsUUID++;
        this.actions.set(this.actionsUUID, callback);
        return this.actionsUUID;
    }

    rmv(UUID: any | number) {
        return this.actions.delete(UUID);
    }

    test(): boolean[] {
        const result: boolean[] = [];
        this.actions.forEach((act) => {
            const val = isFunction(act) ? act() : act;
            result.push(val);
        });
        return result;
    }
}

/**
    {@link shxActions} provides a means of on-demand rendering.
    Suitable for situations where it is impossible to predict in advance whether rendering is needed.

    Recommended usage: 
      Call {@link shxActions.add} at the start of the Event.
      Call {@link shxActions.rmv} at the end.
      Your `Action` is automatically invoked when attempting to determine whether each frame needs to be rendered.

    Note: 
      {@link shxActions} is NOT the most recommended on-demand rendering method.
      It can cause trouble when the state is restored (such as restarting the game).
*/
export const shxActions = new ShxAction();

window.actions = shxActions;
