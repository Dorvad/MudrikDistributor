import { isDivisionOf, type Division } from './distribute';
import { cleanName, mergeIntoBank, nameKey } from './names';
import { EMPTY_DATA, type AppData } from './state';

export const STORAGE_KEY = 'MudrikDidtribution.v1';

export type View = 'select' | 'results';

export interface StoredState extends AppData {
  /** The screen that was open last. */
  view: View;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/**
 * Rebuilds a valid state from whatever was read from storage. Each part is
 * checked on its own, so a damaged division or attendance list does not cost
 * the name bank.
 */
export function sanitize(raw: unknown): StoredState {
  if (!isRecord(raw)) return { ...EMPTY_DATA, view: 'select' };

  const bank = mergeIntoBank([], strings(raw.bank)).bank;
  const byKey = new Map(bank.map((name) => [nameKey(name), name]));
  const inBank = (name: string) => byKey.get(nameKey(cleanName(name)));

  const presentSet = new Set<string>();
  for (const name of strings(raw.present)) {
    const match = inBank(name);
    if (match !== undefined) presentSet.add(match);
  }
  const present = bank.filter((name) => presentSet.has(name));

  let division: Division | null = null;
  if (Array.isArray(raw.division) && raw.division.length === 3 && raw.division.every(Array.isArray)) {
    const groups = (raw.division as unknown[][]).map((group) =>
      group.map((name) => (typeof name === 'string' ? inBank(name) : undefined)),
    );
    const complete = groups.every((group) => group.every((name) => name !== undefined));
    if (complete && isDivisionOf(groups as string[][], present)) {
      division = groups as Division;
    }
  }

  const view: View = raw.view === 'results' && division !== null ? 'results' : 'select';
  return { bank, present, division, view };
}

export interface LoadResult {
  state: StoredState;
  /** False when the browser refuses access to storage. */
  available: boolean;
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Reads the saved state. Never throws. */
export function loadState(): LoadResult {
  const empty: StoredState = { ...EMPTY_DATA, view: 'select' };
  const storage = getStorage();
  if (!storage) return { state: empty, available: false };

  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: empty, available: false };
  }
  if (text === null) return { state: empty, available: true };

  try {
    return { state: sanitize(JSON.parse(text)), available: true };
  } catch {
    // Unreadable JSON. Start clean, and the next save replaces it.
    return { state: empty, available: true };
  }
}

/** Writes the state. Returns false when the browser refuses the write. */
export function saveState(state: StoredState): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        bank: state.bank,
        present: state.present,
        division: state.division,
        view: state.view,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
