import { expect, test } from 'vitest';
import { useChapter, branch, BranchUnit, FlagUnit, JumpUnit } from '../../src/core';

test('branch with simple string targets', () => {
    const { dump } = useChapter('branch_test_1');

    branch({
        Condition: () => 'A',
        A: 'label_a',
        B: 'label_b'
    });

    const { cache } = dump();
    const story = cache.get('branch_test_1') as (BranchUnit | FlagUnit)[];

    // Expecting BranchUnit followed by ENDFLAG
    expect(story).toHaveLength(2);
    
    const branchUnit = story[0] as BranchUnit;
    expect(branchUnit.type).toBe('branch');
    expect(branchUnit.targets['A']).toBe('label_a');
    expect(branchUnit.targets['B']).toBe('label_b');
    
    // Check generated ENDFLAG
    expect(story[1].type).toBe('flag');
    expect((story[1] as FlagUnit).name).toBe(branchUnit.ENDFLAG);
});

test('branch with functional targets (blocks)', () => {
    const { dump } = useChapter('branch_test_2');

    branch({
        Condition: () => 'A',
        A: () => {
             // This content should run during definition
        }
    });

    const { cache } = dump();
    const story = cache.get('branch_test_2');
    expect(story).toBeDefined();
    const units = story!;

    // Sequence:
    // 0: BranchUnit
    // 1: FlagUnit (Label for A)
    // 2: JumpUnit (Jump to ENDFLAG) - because A() was empty
    // 3: FlagUnit (ENDFLAG)

    expect(units).toHaveLength(4);

    const branchUnit = units[0] as BranchUnit;
    expect(branchUnit.type).toBe('branch');
    
    const labelA = branchUnit.targets['A'];
    expect(labelA).toBeTruthy();
    expect(labelA).not.toBe('A'); // should be generated hash

    // Verify label flag is created
    const labelFlag = units[1] as FlagUnit;
    expect(labelFlag.type).toBe('flag');
    expect(labelFlag.name).toBe(labelA);

    // Verify jump to ENDFLAG is created
    const jumpEnd = units[2] as JumpUnit;
    expect(jumpEnd.type).toBe('jump');
    expect(jumpEnd.target).toBe(branchUnit.ENDFLAG);

    // Verify ENDFLAG exists
    const endFlag = units[3] as FlagUnit;
    expect(endFlag.type).toBe('flag');
    expect(endFlag.name).toBe(branchUnit.ENDFLAG);
});

test('branch mix string and function', () => {
    const { dump } = useChapter('branch_test_3');
    
    branch({
        Condition: () => 'A',
        A: 'label_a',
        B: () => {}
    });
    
    const { cache } = dump();
    const units = cache.get('branch_test_3')!;
    
    // 0: Branch
    // 1: Flag (Label for B)
    // 2: Jump (B end)
    // 3: Flag (ENDFLAG)
    
    expect(units).toHaveLength(4);
    
    const branchUnit = units[0] as BranchUnit;
    expect(branchUnit.targets['A']).toBe('label_a');
    expect(branchUnit.targets['B']).not.toBe('B'); // generated
});
