/**
 * Parsing and comparing participant names.
 *
 * A name keeps the spelling the user typed. Only surrounding whitespace,
 * repeated inner whitespace and invisible formatting characters are removed.
 */

/** Comma, semicolon or line break, in any amount. */
const SEPARATORS = /[,;\n\r]+/;

/**
 * Invisible characters that arrive with text copied from chat and office
 * apps: zero-width spaces, direction marks, embedding controls and the BOM.
 * They never change how a name reads, but they would create phantom duplicates.
 */
const INVISIBLE = /[​‎‏‪-‮⁠⁦-⁩﻿]/g;

/** Any run of whitespace, including tabs and non-breaking spaces. */
const WHITESPACE_RUN = /[\s ]+/g;

/** Trims a single name and collapses inner whitespace to one space. */
export function cleanName(raw: string): string {
  return raw.replace(INVISIBLE, '').replace(WHITESPACE_RUN, ' ').trim();
}

/**
 * The identity of a name for duplicate detection. Two spellings that differ
 * only in letter case, in the kind of hyphen (maqaf, dash) or in the kind of
 * apostrophe or quote mark (geresh, gershayim) are the same person.
 */
export function nameKey(name: string): string {
  return cleanName(name)
    .normalize('NFKC')
    .replace(/[־‐-―−]/g, '-')
    .replace(/[׳‘’ʼ`]/g, "'")
    .replace(/[״“”]/g, '"')
    .toLocaleLowerCase();
}

/** True when the text contains a list separator, so it holds several names. */
export function looksLikeList(text: string): boolean {
  return SEPARATORS.test(text);
}

/**
 * Splits free text into clean names. Empty items are dropped and repeats
 * inside the text are removed, keeping the first spelling.
 */
export function parseNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of text.split(SEPARATORS)) {
    const name = cleanName(part);
    if (!name) continue;
    const key = nameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

/** How many non-empty items the text holds before duplicates are removed. */
export function countItems(text: string): number {
  return text.split(SEPARATORS).filter((part) => cleanName(part) !== '').length;
}

const collator = new Intl.Collator('he', { sensitivity: 'base', numeric: true });

/** Alphabetical order for the name bank. */
export function sortNames(names: readonly string[]): string[] {
  return [...names].sort((a, b) => collator.compare(a, b));
}

export interface MergeResult {
  /** The bank after the merge, sorted. */
  bank: string[];
  /** Every incoming name, in the spelling the bank holds. */
  resolved: string[];
  /** Names that were not in the bank before. */
  added: string[];
}

/**
 * Adds names to the bank. A name the bank already holds is not added again,
 * and the spelling already in the bank wins.
 */
export function mergeIntoBank(bank: readonly string[], incoming: readonly string[]): MergeResult {
  const byKey = new Map<string, string>();
  for (const name of bank) byKey.set(nameKey(name), name);

  const resolved: string[] = [];
  const added: string[] = [];
  const seen = new Set<string>();
  for (const raw of incoming) {
    const name = cleanName(raw);
    if (!name) continue;
    const key = nameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    const existing = byKey.get(key);
    if (existing !== undefined) {
      resolved.push(existing);
    } else {
      byKey.set(key, name);
      resolved.push(name);
      added.push(name);
    }
  }
  return { bank: sortNames([...byKey.values()]), resolved, added };
}
