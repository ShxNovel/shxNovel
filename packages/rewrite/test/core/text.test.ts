import { assert, expectTypeOf, assertType, expect, test, describe } from 'vitest';
import { fail } from 'assert';
import { useChapter, character, TextUnit } from '../../src/core';

test('plain character', () => {
    const { dump } = useChapter('1.1.1');

    const aside = character(null);
    const me = character('me');

    me`11`;
    aside`aa``bb`;
    me`22`.fast('xxxx')`33`.pause(1000)`44`;
    aside().fast('yyyy');
    me``.pause(1000);

    const { name, cache } = dump();

    expect(name).toEqual('1.1.1');

    const story = cache.get(name) as TextUnit[];
    expect(story).toHaveLength(5);

    Object.values(story).forEach(unit => {
        expect(unit.type).toEqual('text');
    });

    expect(story[0].name).toEqual('me');
    expect(story[1].name).toEqual(null);
    expect(story[2].name).toEqual('me');
    expect(story[3].name).toEqual(null);
    expect(story[4].name).toEqual('me');

    expect(story[0].quote).toEqual(true);
    expect(story[1].quote).toEqual(false);
    expect(story[2].quote).toEqual(true);
    expect(story[3].quote).toEqual(false);
    expect(story[4].quote).toEqual(true);

    expect(story[0].content).toHaveLength(1);
    expect(story[1].content).toHaveLength(2);
    expect(story[2].content).toHaveLength(5);
    expect(story[3].content).toHaveLength(1);
    expect(story[4].content).toHaveLength(2);
});

test('overide character', () => {
    const name = `1.1.1`;
    try {
        const { dump } = useChapter(name);
        fail();
    } catch (e) {
        const m = (e as Error).message;
        expect(m).toEqual(`Chapter ${name} already exists`);
    }
});

test('multiple character', () => {
    const { dump } = useChapter('1.1.2');

    const aside = character(null);
    const me = character('me');

    me`11`;
    aside`aa``bb`;
    me`22`.fast('xxxx')`33`.pause(1000)`44`;
    aside().fast('yyyy');
    me``.pause(1000);

    // console.dir(dump(), { depth: null });

    // expect(dump()).toMatchSnapshot();
});
