import { isDivisionOf, type Division } from './distribute';
import { mergeIntoBank } from './names';

/**
 * The data of the app. The name bank and the attendance are separate: a name
 * stays in the bank when it is not marked as present.
 *
 * Invariants kept by every function in this module:
 * - `bank` is sorted and holds no duplicates.
 * - `present` is a subset of `bank`, in bank order.
 * - `division` is null or holds exactly the present names.
 */
export interface AppData {
  bank: string[];
  present: string[];
  division: Division | null;
}

export const EMPTY_DATA: AppData = { bank: [], present: [], division: null };

function sameMembers(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((name) => set.has(name));
}

/** Applies a new attendance list. A changed attendance cancels the division. */
function withPresent(data: AppData, bank: string[], presentSet: ReadonlySet<string>): AppData {
  const present = bank.filter((name) => presentSet.has(name));
  const division = sameMembers(present, data.present) ? data.division : null;
  return { bank, present, division };
}

/** Adds names to the bank and marks every one of them as present. */
export function addNames(data: AppData, names: readonly string[]): AppData {
  const merged = mergeIntoBank(data.bank, names);
  if (merged.resolved.length === 0) return data;
  return withPresent(data, merged.bank, new Set([...data.present, ...merged.resolved]));
}

export function togglePresent(data: AppData, name: string): AppData {
  if (!data.bank.includes(name)) return data;
  const next = new Set(data.present);
  if (!next.delete(name)) next.add(name);
  return withPresent(data, data.bank, next);
}

export function selectAll(data: AppData): AppData {
  return withPresent(data, data.bank, new Set(data.bank));
}

export function clearSelection(data: AppData): AppData {
  return withPresent(data, data.bank, new Set());
}

/**
 * Deletes a name from the bank for good. If the name was present, the
 * attendance changes with it and the division is cancelled.
 */
export function removeName(data: AppData, name: string): AppData {
  if (!data.bank.includes(name)) return data;
  const bank = data.bank.filter((item) => item !== name);
  return withPresent(data, bank, new Set(data.present));
}

/** Stores a division, provided it matches the current attendance. */
export function withDivision(data: AppData, division: Division): AppData {
  if (!isDivisionOf(division, data.present)) return { ...data, division: null };
  return { ...data, division };
}
