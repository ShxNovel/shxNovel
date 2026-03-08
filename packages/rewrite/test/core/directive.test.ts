import { expect, test } from 'vitest';
import { useChapter, directive, Directive } from '../../src/core';

test('directive scene boundary', () => {
    const { dump } = useChapter('directive_test_1');

    directive.SceneBoundary;

    const { cache } = dump();
    const story = cache.get('directive_test_1') as Directive[];

    expect(story).toHaveLength(1);
    expect(story[0].type).toBe('directive');
    expect(story[0].kind).toBe('scene-boundary');
});

test('directive scene bind next', () => {
    const { dump } = useChapter('directive_test_2');

    directive.SceneBindNext;

    const { cache } = dump();
    const story = cache.get('directive_test_2') as Directive[];

    expect(story).toHaveLength(1);
    expect(story[0].type).toBe('directive');
    expect(story[0].kind).toBe('scene-bind-next');
});
