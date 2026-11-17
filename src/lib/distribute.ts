/**
 * Random division of the present participants into three groups.
 */

export const GROUP_COUNT = 3;

/** Three ordered lists of names. Group 1 is first. */
export type Division = [string[], string[], string[]];

/** Returns an integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number;

/**
 * Uniform random integer from Web Crypto. Values that would bias the result
 * are rejected and drawn again. Falls back to Math.random when Web Crypto is
 * not available.
 */
export const secureRandomInt: RandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive integer');
  }
  if (maxExclusive === 1) return 0;
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    const range = 0x1_0000_0000;
    const limit = range - (range % maxExclusive);
    const buffer = new Uint32Array(1);
    for (;;) {
      webCrypto.getRandomValues(buffer);
      const value = buffer[0]!;
      if (value < limit) return value % maxExclusive;
    }
  }
  return Math.floor(Math.random() * maxExclusive);
};

/** Fisher–Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[], randomInt: RandomInt = secureRandomInt): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

/**
 * Sizes of the three groups for a head count. The largest and the smallest
 * differ by one at most, and the larger groups come first: 10 gives 4, 3, 3.
 */
export function groupSizes(count: number): [number, number, number] {
  const total = Math.max(0, Math.floor(count));
  const base = Math.floor(total / GROUP_COUNT);
  const extra = total % GROUP_COUNT;
  return [base + (extra > 0 ? 1 : 0), base + (extra > 1 ? 1 : 0), base];
}

/** Cuts an ordered list into the three groups. */
function split(ordered: readonly string[]): Division {
  const [a, b] = groupSizes(ordered.length);
  return [ordered.slice(0, a), ordered.slice(a, a + b), ordered.slice(a + b)];
}

/** Shuffles the participants and divides them into three groups. */
export function divide(participants: readonly string[], randomInt: RandomInt = secureRandomInt): Division {
  return split(shuffle(participants, randomInt));
}

/** Who sits in which numbered group, ignoring the order inside a group. */
function labelledKey(division: Division): string {
  return JSON.stringify(division.map((group) => [...group].sort()));
}

/** Who sits with whom, ignoring the group numbers as well. */
function teamsKey(division: Division): string {
  return JSON.stringify(division.map((group) => JSON.stringify([...group].sort())).sort());
}

/**
 * Divides the same participants again and returns a line-up that differs from
 * the previous one. With two participants or more a different line-up always
 * exists. With fewer, the previous division is returned unchanged.
 */
export function redivide(previous: Division, randomInt: RandomInt = secureRandomInt): Division {
  const participants = previous.flat();
  if (participants.length < 2) return previous;

  const previousLabelled = labelledKey(previous);
  const previousTeams = teamsKey(previous);
  let labelledOnly: Division | null = null;

  for (let attempt = 0; attempt < 24; attempt++) {
    const candidate = divide(participants, randomInt);
    if (teamsKey(candidate) !== previousTeams) return candidate;
    if (labelledOnly === null && labelledKey(candidate) !== previousLabelled) labelledOnly = candidate;
  }
  if (labelledOnly) return labelledOnly;

  // Guaranteed change: the first members of groups 1 and 2 trade places.
  const swapped: Division = [[...previous[0]], [...previous[1]], [...previous[2]]];
  const fromFirst = swapped[0][0]!;
  swapped[0][0] = swapped[1][0]!;
  swapped[1][0] = fromFirst;
  return swapped;
}

/**
 * True when the division holds exactly the present participants, each one
 * once, in three groups whose sizes differ by one at most.
 */
export function isDivisionOf(division: readonly (readonly string[])[], present: readonly string[]): boolean {
  if (division.length !== GROUP_COUNT) return false;
  const members = division.flat();
  if (members.length !== present.length) return false;
  const expected = new Set(present);
  if (expected.size !== present.length) return false;
  const seen = new Set<string>();
  for (const name of members) {
    if (!expected.has(name) || seen.has(name)) return false;
    seen.add(name);
  }
  const sizes = division.map((group) => group.length);
  return Math.max(...sizes) - Math.min(...sizes) <= 1;
}
