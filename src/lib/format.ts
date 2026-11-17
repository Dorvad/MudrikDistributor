import type { Division } from './distribute';

/** "0 משתתפים", "משתתף אחד", "4 משתתפים". */
export function participantsLabel(count: number): string {
  return count === 1 ? 'משתתף אחד' : `${count} משתתפים`;
}

export function groupTitle(index: number): string {
  return `קבוצה ${index + 1}`;
}

/** Plain text of the division, for pasting into a message or a document. */
export function divisionToText(division: Division): string {
  return division
    .map((group, index) => {
      const heading = `${groupTitle(index)} (${participantsLabel(group.length)})`;
      return [heading, ...group].join('\n');
    })
    .join('\n\n');
}

/** What happened to the names that were just submitted. */
export function additionSummary(submitted: number, added: number): string {
  const repeats = submitted - added;
  const parts: string[] = [];
  if (added === 1) parts.push('נוסף שם אחד לבנק.');
  else if (added > 1) parts.push(`נוספו ${added} שמות לבנק.`);
  if (repeats === 1) parts.push('כפילות אחת לא נוספה שוב.');
  else if (repeats > 1) parts.push(`${repeats} כפילויות לא נוספו שוב.`);
  return parts.join(' ');
}
