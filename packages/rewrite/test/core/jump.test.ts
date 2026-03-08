import { expect, test } from 'vitest';
import { useChapter, jump, JumpUnit } from '../../src/core';

test('jump basic', () => {
    const { dump } = useChapter('jump_test_1');
    
    jump('target_label');

    const { cache } = dump();
    const story = cache.get('jump_test_1') as JumpUnit[];

    expect(story).toHaveLength(1);
    expect(story[0].type).toBe('jump');
    expect(story[0].target).toBe('target_label');
});

test('jump empty target error', () => {
    const { dump } = useChapter('jump_test_2');
    expect(() => jump('')).toThrowError('Jump target cannot be empty');
});
