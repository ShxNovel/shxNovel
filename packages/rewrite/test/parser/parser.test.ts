import { describe, expect, test } from 'vitest';
import { useChapter, character, system, flag, jump, directive } from '../../src/core';
import { rewriteParser } from '../../src/parser/rewrite-parser';
import { TickIR } from '@shxnovel/schema';

describe('Rewrite Parser Integration', () => {

    test('Single Tick with Text only', () => {
        const { dump } = useChapter('parser_test_1');
        const me = character('me');

        me`Hello World`;

        const { cache } = dump();
        // @ts-ignore
        rewriteParser.solveOne('parser_test_1', cache.get('parser_test_1') as any);

        const irs = rewriteParser.cache.get('parser_test_1')!;
        expect(irs).toHaveLength(1);

        const tick = irs[0] as TickIR;
        expect(tick.type).toBe('tick');
        expect(tick.text).toBeDefined();
        expect(tick.text.name).toBe('me');
        expect(tick.text.content).toEqual(['Hello World']);

        expect(tick.animate).toEqual([]);
        expect(tick.system).toEqual([]);
    });

    test('Complex Tick: Text + System', () => {
        const { dump } = useChapter('parser_test_2');
        const me = character('me');

        me`Start`.pause(500);
        // @ts-ignore
        system().usePipeline('blur');

        const { cache } = dump();
        // @ts-ignore
        rewriteParser.solveOne('parser_test_2', cache.get('parser_test_2') as any);

        const irs = rewriteParser.cache.get('parser_test_2')!;
        expect(irs).toHaveLength(1);

        const tick = irs[0] as TickIR;
        expect(tick.text.content).toHaveLength(2);
        expect(tick.system).toHaveLength(1);
        expect(tick.system[0].kind).toBe('usePipeline');
    });

    test('Flow Control Integration', () => {
        const { dump } = useChapter('parser_test_3');
        const me = character('me');

        me`Tick 1`;

        flag('flag_A');

        me`Tick 2`;

        jump('flag_B');

        const { cache } = dump();
        // @ts-ignore
        rewriteParser.solveOne('parser_test_3', cache.get('parser_test_3') as any);

        const irs = rewriteParser.cache.get('parser_test_3')!;

        expect(irs).toHaveLength(4);

        expect(irs[0].type).toBe('tick');
        expect(irs[1].type).toBe('flag');
        expect(irs[2].type).toBe('tick');
        expect(irs[3].type).toBe('jump');
    });

    test('Directive Meta Merging', () => {
        const { dump } = useChapter('parser_test_4');
        const me = character('me');

        directive.SceneBindNext;
        me`Scene End`;

        const { cache } = dump();
        // @ts-ignore
        rewriteParser.solveOne('parser_test_4', cache.get('parser_test_4') as any);

        const irs = rewriteParser.cache.get('parser_test_4')!;

        expect(irs).toHaveLength(1);

        const tick = irs[0] as TickIR;
        expect(tick.meta?.bindNext).toBe(true);
        expect(tick.text.content).toEqual(['Scene End']);
    });
});
