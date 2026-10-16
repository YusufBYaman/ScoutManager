/**
 * High-performance, OVR/POT-weighted player search engine
 * Case-insensitive, Turkish-aware, and diacritics/accent-insensitive
 */

export function normalizeSearchText(str) {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Levenshtein distance helper for small typo tolerance (query length >= 4)
 */
function isCloseMatch(target, query) {
  if (Math.abs(target.length - query.length) > 1) return false;
  let diff = 0;
  let i = 0, j = 0;
  while (i < target.length && j < query.length) {
    if (target[i] !== query[j]) {
      diff++;
      if (diff > 1) return false;
      if (target.length > query.length) i++;
      else if (query.length > target.length) j++;
      else { i++; j++; }
    } else {
      i++;
      j++;
    }
  }
  return true;
}

export function searchPlayersByNamePrefix(players, query, maxResults = 20) {
  const normQuery = normalizeSearchText(query);
  if (!normQuery || normQuery.length === 0) return [];

  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const scoredResults = [];

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const normFull = normalizeSearchText(p.name);
    const normFirst = normalizeSearchText(p.firstName);
    const normLast = normalizeSearchText(p.lastName);
    const normCommon = normalizeSearchText(p.commonName);

    let matchScore = 0;

    // 1. Exact matches
    if (normCommon === normQuery || normLast === normQuery || normFull === normQuery) {
      matchScore += 2500;
    } else if (normFirst === normQuery) {
      matchScore += 1500;
    }

    // 2. Direct prefix matches
    if (normCommon.startsWith(normQuery)) {
      matchScore += 1200;
    } else if (normLast.startsWith(normQuery)) {
      matchScore += 1000;
    } else if (normFirst.startsWith(normQuery)) {
      matchScore += 600;
    } else if (normFull.startsWith(normQuery)) {
      matchScore += 800;
    }

    // 3. Multi-token / Word prefix matching
    const words = normFull.split(/\s+/);
    let allTokensMatch = true;
    for (const tok of tokens) {
      const tokMatch =
        normCommon.startsWith(tok) ||
        normLast.startsWith(tok) ||
        normFirst.startsWith(tok) ||
        words.some(w => w.startsWith(tok));
      if (!tokMatch) {
        allTokensMatch = false;
        break;
      }
    }

    if (allTokensMatch) {
      matchScore += 500 * tokens.length;
    } else if (tokens.length === 1 && normFull.includes(normQuery)) {
      matchScore += 150;
    }

    // 4. Typo tolerance if query >= 4 and no match yet
    if (matchScore === 0 && normQuery.length >= 4) {
      if (
        (normCommon && isCloseMatch(normCommon, normQuery)) ||
        (normLast && isCloseMatch(normLast, normQuery)) ||
        words.some(w => isCloseMatch(w, normQuery))
      ) {
        matchScore += 80;
      }
    }

    if (matchScore > 0) {
      // Bonus: Prioritize higher rated players (world stars) and high potential
      const ovr = p.overall || 50;
      const pot = p.potential || ovr;
      const ratingBonus = ovr * 12 + pot * 5;

      scoredResults.push({
        player: p,
        score: matchScore + ratingBonus
      });
    }
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, maxResults).map(r => r.player);
}
