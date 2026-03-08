import { ExtAnimateOp, ExtSystemOp, StoryIR, TextIR, TickIR } from '@shxnovel/schema';
import { flagTable } from "./flag-table";

import { FlagUnit, JumpUnit, TextUnit, BranchUnit, SystemUnit, AnimateUnit, ChapterUnit, Directive } from '../core';

type Nodefn<T = any> = (this: RewriteParser, unit: ChapterUnit & { type: T }) => boolean | void;

type NodeType = ChapterUnit['type'];

export class SceneBlock implements TickIR {
    type: 'tick' = 'tick';
    text: TextIR = {
        name: null,
        quote: false,
        content: []
    };
    animate: ExtAnimateOp[] = [];
    system: ExtSystemOp[] = [];
    meta: Record<string, any> = {};

    isEmpty() {
        return this.text.content.length === 0
            && this.animate.length === 0
            && this.system.length === 0;
    }
}

/**
 * A Stateful Pipeline
 */
export class RewriteParser {
    cache: Map<string, StoryIR[]> = new Map();

    ctx = {
        name: '',
        ir: new SceneBlock(),
        irs: [] as StoryIR[],
    };

    pushIR() {
        if (this.ctx.ir.isEmpty()) return;
        this.ctx.irs.push(this.ctx.ir);
        this.ctx.ir = new SceneBlock();
    }

    beforeNode: Map<string, Nodefn> = new Map();
    onNode: Map<string, Nodefn> = new Map();
    afterNode: Map<string, Nodefn> = new Map();

    setBeforeNode<K extends NodeType>(key: K, fn: Nodefn<K>) {
        this.beforeNode.set(key, fn);
    }

    setOnNode<K extends NodeType>(key: K, fn: Nodefn<K>) {
        this.onNode.set(key, fn);
    }

    setAfterNode<K extends NodeType>(key: K, fn: Nodefn<K>) {
        this.afterNode.set(key, fn);
    }

    solveSome(some: Record<string, ChapterUnit[]>) {
        Object.entries(some).forEach(([key, value]) => {
            this.solveOne(key, value);
        });
    }

    solveOne(name: string, units: ChapterUnit[]) {
        this.ctx.name = name;

        for (const unit of units) {
            const type = unit.type;

            if (this.beforeNode.has(type)) {
                const result = this.beforeNode.get(type)!.call(this, unit);
                if (result === false) continue;
            }

            if (this.onNode.has(type)) {
                const result = this.onNode.get(type)!.call(this, unit);
                if (result === false) continue;
            }

            if (this.afterNode.has(type)) {
                const result = this.afterNode.get(type)!.call(this, unit);
                if (result === false) continue;
            }
        }

        this.pushIR();

        this.cache.set(name, this.ctx.irs);
        this.ctx = {
            name: '',
            ir: new SceneBlock(),
            irs: [] as StoryIR[],
        };
    }
}

export const rewriteParser = new RewriteParser();

// text
rewriteParser.setBeforeNode('text', function () {
    this.pushIR();
});
rewriteParser.setOnNode('text', function (unit: TextUnit) {
    const { type, meta, ...ir } = unit;
    this.ctx.ir.text = ir;
    if (meta) Object.assign(this.ctx.ir.meta, meta);
});

// animate
rewriteParser.setOnNode('animate', function (unit: AnimateUnit) {
    const { content, meta } = unit;
    this.ctx.ir.animate.push(...content);
    if (meta) Object.assign(this.ctx.ir.meta, meta);
});

// system
rewriteParser.setBeforeNode('system', function (unit: SystemUnit) {
    const c = unit.content;
    if (c.length === 0) return false; // no content, skip
});

rewriteParser.setOnNode('system', function (unit: SystemUnit) {
    const { content, meta } = unit;
    this.ctx.ir.system.push(...content);
    if (meta) Object.assign(this.ctx.ir.meta, meta);
});

// Flow

rewriteParser.setOnNode('branch', function (unit: BranchUnit) {
    this.pushIR();
    this.ctx.irs.push(unit);
});

// rewriteParser.setOnNode('choice', function (unit: ChoiceUnit) {
//     this.pushIR();
//     this.ctx.irs.push(unit);
// });

rewriteParser.setOnNode('flag', function (unit: FlagUnit) {
    this.pushIR();
    flagTable.add(unit.name, this.ctx.name);
    this.ctx.irs.push(unit);
});

rewriteParser.setOnNode('jump', function (unit: JumpUnit) {
    this.pushIR();
    this.ctx.irs.push(unit);
});

// Directive

rewriteParser.setOnNode('directive', function (unit: Directive) {
    const name = unit.kind;
    if (name == 'scene-boundary') {
        this.pushIR();
    } else if (name == 'scene-bind-next') {
        this.ctx.ir.meta.bindNext = true;
    } else {
        console.warn(`Unknown directive: ${name}`);
    }
    
    if (unit.meta) Object.assign(this.ctx.ir.meta, unit.meta);
});
