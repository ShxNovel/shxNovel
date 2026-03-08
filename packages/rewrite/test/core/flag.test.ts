import { expect, test } from 'vitest';
import { useChapter, flag, FlagUnit } from '../../src/core';

test('flag basic', () => {
    const { dump } = useChapter('flag_test_1');
    
    flag('flag1');
    flag('flag2', () => {
        flag('inner_flag');
    });

    const { cache } = dump();
    const story = cache.get('flag_test_1') as FlagUnit[];

    expect(story).toHaveLength(3);
    
    expect(story[0].type).toBe('flag');
    expect(story[0].name).toBe('flag1');

    expect(story[1].type).toBe('flag');
    expect(story[1].name).toBe('flag2');

    expect(story[2].type).toBe('flag');
    expect(story[2].name).toBe('inner_flag');
});

test('flag empty name error', () => {
    const { dump } = useChapter('flag_test_2');
    expect(() => flag('')).toThrowError('Flag name cannot be empty');
});
