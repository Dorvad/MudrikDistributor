import { describe, expect, it } from 'vitest';
import { divide, groupSizes, isDivisionOf, redivide, secureRandomInt, shuffle, type Division } from './distribute';

const people = (count: number) => Array.from({ length: count }, (_, index) => `משתתף ${index + 1}`);
const sizesOf = (division: Division) => division.map((group) => group.length);

describe('groupSizes', () => {
  it('matches the required examples', () => {
    expect(groupSizes(12)).toEqual([4, 4, 4]);
    expect(groupSizes(10)).toEqual([4, 3, 3]);
    expect(groupSizes(2)).toEqual([1, 1, 0]);
    expect(groupSizes(11)).toEqual([4, 4, 3]);
    expect(groupSizes(1)).toEqual([1, 0, 0]);
    expect(groupSizes(0)).toEqual([0, 0, 0]);
  });

  it('never differs by more than one and always sums to the head count', () => {
    for (let count = 0; count <= 200; count++) {
      const sizes = groupSizes(count);
      expect(sizes[0] + sizes[1] + sizes[2]).toBe(count);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    }
  });
});

describe('secureRandomInt', () => {
  it('stays inside the range and reaches every value', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const value = secureRandomInt(7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
      seen.add(value);
    }
    expect(seen.size).toBe(7);
  });

  it('rejects an invalid range', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(2.5)).toThrow(RangeError);
  });
});

describe('shuffle', () => {
  it('is a Fisher–Yates pass driven by the random source', () => {
    // Always choosing index 0 moves each last element to the front in turn.
    expect(shuffle(['א', 'ב', 'ג', 'ד'], () => 0)).toEqual(['ב', 'ג', 'ד', 'א']);
    // Always choosing the last index leaves the order as it is.
    expect(shuffle(['א', 'ב', 'ג', 'ד'], (max) => max - 1)).toEqual(['א', 'ב', 'ג', 'ד']);
  });

  it('keeps every item once and leaves the input untouched', () => {
    const input = people(30);
    const copy = [...input];
    const result = shuffle(input);
    expect(input).toEqual(copy);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it('gives each item each position at a similar rate', () => {
    const rounds = 6000;
    const firstPlace = new Map<string, number>();
    for (let i = 0; i < rounds; i++) {
      const first = shuffle(['א', 'ב', 'ג'])[0]!;
      firstPlace.set(first, (firstPlace.get(first) ?? 0) + 1);
    }
    for (const name of ['א', 'ב', 'ג']) {
      const share = (firstPlace.get(name) ?? 0) / rounds;
      expect(share).toBeGreaterThan(0.28);
      expect(share).toBeLessThan(0.39);
    }
  });
});

describe('divide', () => {
  it('always returns three groups with every participant exactly once', () => {
    for (let count = 0; count <= 60; count++) {
      const participants = people(count);
      const division = divide(participants);
      expect(division).toHaveLength(3);
      expect(sizesOf(division)).toEqual(groupSizes(count));
      expect(division.flat().sort()).toEqual([...participants].sort());
      expect(isDivisionOf(division, participants)).toBe(true);
    }
  });

  it('gives 4/4/4, 4/3/3 and 1/1/0', () => {
    expect(sizesOf(divide(people(12)))).toEqual([4, 4, 4]);
    expect(sizesOf(divide(people(10)))).toEqual([4, 3, 3]);
    expect(sizesOf(divide(people(2)))).toEqual([1, 1, 0]);
  });
});

describe('redivide', () => {
  const labelled = (division: Division) => JSON.stringify(division.map((group) => [...group].sort()));
  const teams = (division: Division) => JSON.stringify(division.map((group) => JSON.stringify([...group].sort())).sort());

  it('keeps the same participants and sizes', () => {
    const first = divide(people(10));
    const second = redivide(first);
    expect(sizesOf(second)).toEqual([4, 3, 3]);
    expect(second.flat().sort()).toEqual(first.flat().sort());
  });

  it('always changes the line-up when there are two participants or more', () => {
    for (let count = 2; count <= 12; count++) {
      let current = divide(people(count));
      for (let round = 0; round < 40; round++) {
        const next = redivide(current);
        expect(labelled(next)).not.toBe(labelled(current));
        expect(isDivisionOf(next, people(count))).toBe(true);
        current = next;
      }
    }
  });

  it('changes who is grouped with whom whenever that is possible', () => {
    // From four participants on, more than one set of teams exists.
    for (let count = 4; count <= 12; count++) {
      let current = divide(people(count));
      for (let round = 0; round < 40; round++) {
        const next = redivide(current);
        expect(teams(next)).not.toBe(teams(current));
        current = next;
      }
    }
  });

  it('swaps the two participants when there are only two', () => {
    expect(redivide([['א'], ['ב'], []])).toEqual([['ב'], ['א'], []]);
  });

  it('still changes the line-up when the random source is stuck', () => {
    const previous: Division = [['א', 'ב'], ['ג'], ['ד']];
    const next = redivide(previous, (max) => max - 1);
    expect(labelled(next)).not.toBe(labelled(previous));
    expect(isDivisionOf(next, ['א', 'ב', 'ג', 'ד'])).toBe(true);
  });

  it('returns a single participant or an empty division unchanged', () => {
    const single: Division = [['א'], [], []];
    expect(redivide(single)).toBe(single);
    const none: Division = [[], [], []];
    expect(redivide(none)).toBe(none);
  });
});

describe('isDivisionOf', () => {
  it('accepts a matching division', () => {
    expect(isDivisionOf([['א', 'ב'], ['ג'], ['ד']], ['א', 'ב', 'ג', 'ד'])).toBe(true);
    expect(isDivisionOf([[], [], []], [])).toBe(true);
  });

  it('rejects a missing, extra or repeated participant', () => {
    expect(isDivisionOf([['א'], ['ב'], []], ['א', 'ב', 'ג'])).toBe(false);
    expect(isDivisionOf([['א'], ['ב'], ['ה']], ['א', 'ב', 'ג'])).toBe(false);
    expect(isDivisionOf([['א'], ['א'], ['ב']], ['א', 'ב', 'ג'])).toBe(false);
  });

  it('rejects the wrong number of groups or unbalanced groups', () => {
    expect(isDivisionOf([['א'], ['ב']], ['א', 'ב'])).toBe(false);
    expect(isDivisionOf([['א', 'ב', 'ג'], ['ד'], []], ['א', 'ב', 'ג', 'ד'])).toBe(false);
  });
});
