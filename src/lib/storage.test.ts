import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadState, sanitize, saveState, STORAGE_KEY, type StoredState } from './storage';

function fakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    items,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const valid: StoredState = {
  bank: ['אלון', 'דנה', 'יואב', 'תמר'],
  present: ['אלון', 'דנה', 'תמר'],
  division: [['תמר'], ['אלון'], ['דנה']],
  view: 'results',
};

describe('sanitize', () => {
  it('returns valid data as it is', () => {
    expect(sanitize(valid)).toEqual(valid);
  });

  it('returns an empty state for anything that is not an object', () => {
    const empty = { bank: [], present: [], division: null, view: 'select' };
    expect(sanitize(null)).toEqual(empty);
    expect(sanitize('text')).toEqual(empty);
    expect(sanitize([1, 2])).toEqual(empty);
    expect(sanitize(42)).toEqual(empty);
  });

  it('cleans the bank: bad items, empty names, duplicates, order', () => {
    const result = sanitize({ bank: ['תמר', 7, null, '  ', 'דנה', ' דנה ', { name: 'x' }, 'אלון'] });
    expect(result.bank).toEqual(['אלון', 'דנה', 'תמר']);
  });

  it('keeps the bank when the attendance is damaged', () => {
    const result = sanitize({ ...valid, present: 'broken' });
    expect(result.bank).toEqual(valid.bank);
    expect(result.present).toEqual([]);
    expect(result.division).toBeNull();
    expect(result.view).toBe('select');
  });

  it('drops present names that are not in the bank', () => {
    const result = sanitize({ bank: ['אלון', 'דנה'], present: ['דנה', 'זר', 'דנה', 5] });
    expect(result.present).toEqual(['דנה']);
  });

  it('drops a division that does not match the attendance', () => {
    expect(sanitize({ ...valid, division: [['תמר'], ['אלון'], []] }).division).toBeNull();
    expect(sanitize({ ...valid, division: [['תמר'], ['אלון'], ['דנה'], []] }).division).toBeNull();
    expect(sanitize({ ...valid, division: [['תמר', 'תמר'], ['אלון'], ['דנה']] }).division).toBeNull();
    expect(sanitize({ ...valid, division: [['תמר', 'אלון', 'דנה'], [], []] }).division).toBeNull();
    expect(sanitize({ ...valid, division: [['תמר'], ['אלון'], [3]] }).division).toBeNull();
    expect(sanitize({ ...valid, division: 'broken' }).division).toBeNull();
  });

  it('opens the selection screen when there is no valid division', () => {
    expect(sanitize({ ...valid, division: null }).view).toBe('select');
    expect(sanitize({ ...valid, view: 'unknown' }).view).toBe('select');
  });
});

describe('loadState and saveState', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    expect(saveState(valid)).toBe(true);
    expect(storage.items.has(STORAGE_KEY)).toBe(true);
    expect(loadState()).toEqual({ state: valid, available: true });
  });

  it('starts empty on a first visit', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    expect(loadState()).toEqual({
      state: { bank: [], present: [], division: null, view: 'select' },
      available: true,
    });
  });

  it('recovers from unreadable JSON', () => {
    vi.stubGlobal('localStorage', fakeStorage({ [STORAGE_KEY]: '{"bank": ["אלון"' }));
    const result = loadState();
    expect(result.available).toBe(true);
    expect(result.state.bank).toEqual([]);
  });

  it('recovers what it can from damaged data', () => {
    const damaged = JSON.stringify({ bank: ['אלון', 'דנה'], present: { broken: true }, division: [1, 2, 3], view: 'results' });
    vi.stubGlobal('localStorage', fakeStorage({ [STORAGE_KEY]: damaged }));
    expect(loadState().state).toEqual({ bank: ['אלון', 'דנה'], present: [], division: null, view: 'select' });
  });

  it('reports blocked storage and keeps working', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
    expect(loadState().available).toBe(false);
    expect(loadState().state.bank).toEqual([]);
    expect(saveState(valid)).toBe(false);
  });

  it('reports a failed write, such as a full quota', () => {
    const storage = fakeStorage();
    vi.stubGlobal('localStorage', {
      ...storage,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    });
    expect(loadState().available).toBe(true);
    expect(saveState(valid)).toBe(false);
  });

  it('reports storage that does not exist at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadState().available).toBe(false);
    expect(saveState(valid)).toBe(false);
  });
});
