import { expect, test } from 'vitest';
import { useChapter, system, SystemUnit } from '../../src/core';

test('system pipeline', () => {
    const { dump } = useChapter('sys_test_1');

    system().usePipeline('test-pipe');

    const { cache } = dump();
    const story = cache.get('sys_test_1') as SystemUnit[];

    expect(story).toHaveLength(1);
    expect(story[0].type).toBe('system');
    expect(story[0].content).toHaveLength(1);
    expect(story[0].content[0]).toEqual({ kind: 'usePipeline', name: 'test-pipe' });
});
