import { describe, expect, it } from 'vitest';
import { cleanName, countItems, looksLikeList, mergeIntoBank, nameKey, parseNames, sortNames } from './names';

describe('parseNames', () => {
  it('splits on commas, semicolons and line breaks', () => {
    expect(parseNames('דנה לוי, יואב כהן;נועה פרידמן\nרון אזולאי\r\nתמר רוזנברג')).toEqual([
      'דנה לוי',
      'יואב כהן',
      'נועה פרידמן',
      'רון אזולאי',
      'תמר רוזנברג',
    ]);
  });

  it('collapses extra whitespace and keeps one space between name parts', () => {
    expect(parseNames('  דנה    לוי  ,\tיואב  כהן ')).toEqual(['דנה לוי', 'יואב כהן']);
  });

  it('keeps the spelling, including maqaf, geresh and Latin letters', () => {
    expect(parseNames('מאיה בן־דוד, ג׳ורג׳ חדד, Dana Levi')).toEqual(['מאיה בן־דוד', 'ג׳ורג׳ חדד', 'Dana Levi']);
  });

  it('drops empty items and repeated separators', () => {
    expect(parseNames(',, ;\n\n דנה לוי ,,;\n')).toEqual(['דנה לוי']);
    expect(parseNames('   \n ; , ')).toEqual([]);
    expect(parseNames('')).toEqual([]);
  });

  it('removes repeats inside the list and keeps the first spelling', () => {
    expect(parseNames('דנה לוי, דנה  לוי, Dana Levi, dana levi')).toEqual(['דנה לוי', 'Dana Levi']);
  });

  it('removes invisible direction marks that come with copied text', () => {
    expect(parseNames('‏דנה לוי‎, ﻿יואב כהן')).toEqual(['דנה לוי', 'יואב כהן']);
  });
});

describe('nameKey', () => {
  it('treats hyphen variants and quote variants as the same name', () => {
    expect(nameKey('מאיה בן־דוד')).toBe(nameKey('מאיה בן-דוד'));
    expect(nameKey('ג׳ורג׳')).toBe(nameKey("ג'ורג'"));
    expect(nameKey('Dana LEVI')).toBe(nameKey('dana levi'));
  });

  it('keeps different names apart', () => {
    expect(nameKey('דנה לוי')).not.toBe(nameKey('דנה לוין'));
    expect(nameKey('דנהלוי')).not.toBe(nameKey('דנה לוי'));
  });
});

describe('helpers', () => {
  it('cleanName trims and collapses', () => {
    expect(cleanName('  אביגיל   בת־שבע  ')).toBe('אביגיל בת־שבע');
  });

  it('looksLikeList detects a separator', () => {
    expect(looksLikeList('דנה לוי')).toBe(false);
    expect(looksLikeList('דנה לוי, יואב כהן')).toBe(true);
    expect(looksLikeList('דנה לוי\nיואב כהן')).toBe(true);
    expect(looksLikeList('דנה לוי; יואב כהן')).toBe(true);
  });

  it('countItems counts before duplicates are removed', () => {
    expect(countItems('דנה לוי, דנה לוי; יואב כהן\n\n')).toBe(3);
  });

  it('sortNames orders alphabetically in Hebrew', () => {
    expect(sortNames(['תמר', 'דנה', 'אלון', 'יואב', 'בועז'])).toEqual(['אלון', 'בועז', 'דנה', 'יואב', 'תמר']);
  });
});

describe('mergeIntoBank', () => {
  it('adds new names and keeps the bank sorted', () => {
    const result = mergeIntoBank(['דנה לוי'], ['תמר רוזנברג', 'אלון מזרחי']);
    expect(result.bank).toEqual(['אלון מזרחי', 'דנה לוי', 'תמר רוזנברג']);
    expect(result.added).toEqual(['תמר רוזנברג', 'אלון מזרחי']);
  });

  it('keeps the spelling that is already in the bank', () => {
    const result = mergeIntoBank(['מאיה בן־דוד', 'Dana Levi'], ['מאיה בן-דוד', 'dana  levi', 'יואב כהן']);
    expect(result.bank).toEqual(['יואב כהן', 'מאיה בן־דוד', 'Dana Levi']);
    expect(result.resolved).toEqual(['מאיה בן־דוד', 'Dana Levi', 'יואב כהן']);
    expect(result.added).toEqual(['יואב כהן']);
  });

  it('does not mutate the bank it was given', () => {
    const bank = ['דנה לוי'];
    mergeIntoBank(bank, ['אלון מזרחי']);
    expect(bank).toEqual(['דנה לוי']);
  });
});
