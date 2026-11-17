import { describe, expect, it } from 'vitest';
import { divide } from './distribute';
import { addNames, clearSelection, EMPTY_DATA, removeName, selectAll, togglePresent, withDivision, type AppData } from './state';

const seeded = (names: string[]): AppData => addNames(EMPTY_DATA, names);
const divided = (data: AppData): AppData => withDivision(data, divide(data.present));

describe('addNames', () => {
  it('adds names to the bank and marks them as present', () => {
    const data = seeded(['תמר', 'אלון', 'דנה']);
    expect(data.bank).toEqual(['אלון', 'דנה', 'תמר']);
    expect(data.present).toEqual(['אלון', 'דנה', 'תמר']);
    expect(data.division).toBeNull();
  });

  it('marks an existing unmarked name as present without duplicating it', () => {
    const data = addNames(togglePresent(seeded(['אלון', 'דנה']), 'דנה'), ['דנה']);
    expect(data.bank).toEqual(['אלון', 'דנה']);
    expect(data.present).toEqual(['אלון', 'דנה']);
  });

  it('keeps the division when nothing about the attendance changed', () => {
    const data = divided(seeded(['אלון', 'דנה', 'תמר']));
    expect(addNames(data, ['דנה']).division).toEqual(data.division);
    expect(addNames(data, [])).toBe(data);
  });

  it('cancels the division when a new participant joins', () => {
    const data = divided(seeded(['אלון', 'דנה', 'תמר']));
    expect(addNames(data, ['יואב']).division).toBeNull();
  });
});

describe('attendance', () => {
  it('toggles one name and keeps the bank as it is', () => {
    const data = togglePresent(seeded(['אלון', 'דנה', 'תמר']), 'דנה');
    expect(data.bank).toEqual(['אלון', 'דנה', 'תמר']);
    expect(data.present).toEqual(['אלון', 'תמר']);
    expect(togglePresent(data, 'דנה').present).toEqual(['אלון', 'דנה', 'תמר']);
  });

  it('ignores a name that is not in the bank', () => {
    const data = seeded(['אלון']);
    expect(togglePresent(data, 'זר')).toBe(data);
  });

  it('selects all and clears the selection', () => {
    const data = clearSelection(seeded(['אלון', 'דנה']));
    expect(data.present).toEqual([]);
    expect(data.bank).toEqual(['אלון', 'דנה']);
    expect(selectAll(data).present).toEqual(['אלון', 'דנה']);
  });

  it('cancels the division on any change of attendance', () => {
    const data = divided(seeded(['אלון', 'דנה', 'תמר', 'יואב']));
    expect(data.division).not.toBeNull();
    expect(togglePresent(data, 'דנה').division).toBeNull();
    expect(clearSelection(data).division).toBeNull();
  });

  it('keeps the division when select-all changes nothing', () => {
    const data = divided(seeded(['אלון', 'דנה', 'תמר']));
    expect(selectAll(data).division).toEqual(data.division);
  });
});

describe('removeName', () => {
  it('removes a present name from the bank, the attendance and the division', () => {
    const data = removeName(divided(seeded(['אלון', 'דנה', 'תמר'])), 'דנה');
    expect(data.bank).toEqual(['אלון', 'תמר']);
    expect(data.present).toEqual(['אלון', 'תמר']);
    expect(data.division).toBeNull();
  });

  it('keeps the attendance and the division when an absent name is removed', () => {
    const base = divided(togglePresent(seeded(['אלון', 'דנה', 'תמר', 'יואב']), 'יואב'));
    const data = removeName(base, 'יואב');
    expect(data.bank).toEqual(['אלון', 'דנה', 'תמר']);
    expect(data.present).toEqual(['אלון', 'דנה', 'תמר']);
    expect(data.division).toEqual(base.division);
  });
});

describe('withDivision', () => {
  it('refuses a division that does not match the attendance', () => {
    const data = seeded(['אלון', 'דנה', 'תמר']);
    expect(withDivision(data, [['אלון'], ['דנה'], []]).division).toBeNull();
    expect(withDivision(data, [['אלון'], ['דנה'], ['תמר']]).division).toEqual([['אלון'], ['דנה'], ['תמר']]);
  });
});
