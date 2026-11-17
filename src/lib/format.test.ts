import { describe, expect, it } from 'vitest';
import { additionSummary, divisionToText, participantsLabel } from './format';

describe('participantsLabel', () => {
  it('uses the Hebrew singular and plural', () => {
    expect(participantsLabel(0)).toBe('0 משתתפים');
    expect(participantsLabel(1)).toBe('משתתף אחד');
    expect(participantsLabel(4)).toBe('4 משתתפים');
  });
});

describe('divisionToText', () => {
  it('lists the three headings, the counts and the names', () => {
    const text = divisionToText([['נועה פרידמן', 'רון אזולאי'], ['תמר רוזנברג'], []]);
    expect(text).toBe(
      [
        'קבוצה 1 (2 משתתפים)',
        'נועה פרידמן',
        'רון אזולאי',
        '',
        'קבוצה 2 (משתתף אחד)',
        'תמר רוזנברג',
        '',
        'קבוצה 3 (0 משתתפים)',
      ].join('\n'),
    );
  });
});

describe('additionSummary', () => {
  it('reports new names and repeats', () => {
    expect(additionSummary(3, 3)).toBe('נוספו 3 שמות לבנק.');
    expect(additionSummary(1, 1)).toBe('נוסף שם אחד לבנק.');
    expect(additionSummary(5, 3)).toBe('נוספו 3 שמות לבנק. 2 כפילויות לא נוספו שוב.');
    expect(additionSummary(1, 0)).toBe('כפילות אחת לא נוספה שוב.');
  });
});
