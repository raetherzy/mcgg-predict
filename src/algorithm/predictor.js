import {
  buildMatchupMatrix,
  computeStandardBergerTable,
} from './patternDiscovery';
import { loadGames } from '../store/gameStore';
import { getActivePlayers, isOdd, needsGhost } from './utils';

function findMostFrequentOpponent(matrix, seat, round) {
  const opponents = matrix[seat]?.[round];
  if (!opponents) return { opponent: null, confidence: 0 };

  const entries = Object.entries(opponents);
  if (entries.length === 0) return { opponent: null, confidence: 0 };

  entries.sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  return {
    opponent: parseInt(entries[0][0]),
    confidence: total > 0 ? (entries[0][1] / total) * 100 : 0,
    totalGames: total,
    matchCount: entries[0][1],
  };
}

export function predictFromData(games, activePlayerSeats, roundNumber) {
  const matrix = buildMatchupMatrix(games);
  const predictions = [];

  for (const seat of activePlayerSeats) {
    const result = findMostFrequentOpponent(matrix, seat, roundNumber);
    predictions.push({
      seat,
      predictedOpponent: result.opponent,
      confidence: result.confidence,
      totalGames: result.totalGames,
      matchCount: result.matchCount,
      method: 'historical',
    });
  }

  return predictions;
}

export function predictWithStandardTable(activePlayerSeats, roundNumber, eliminatedSeats) {
  const standard = computeStandardBergerTable();
  const cycleRound = ((roundNumber - 1) % 7) + 1;
  const pairs = standard[cycleRound] || [];
  const predictions = [];

  const expectedMap = new Map();
  for (const pair of pairs) {
    expectedMap.set(pair.seatA, pair.seatB);
    expectedMap.set(pair.seatB, pair.seatA);
  }

  for (const seat of activePlayerSeats) {
    let expectedOpp = expectedMap.get(seat);

    if (eliminatedSeats.includes(expectedOpp)) {
      if (isOdd(activePlayerSeats.length)) {
        const ghostCandidates = activePlayerSeats.filter((s) => s !== seat);
        const strongest = ghostCandidates[0];
        predictions.push({
          seat,
          predictedOpponent: strongest,
          confidence: 50,
          method: 'ghost',
          note: `Opponent eliminated at seat ${expectedOpp}, ghost likely appears`,
        });
      } else {
        const candidates = activePlayerSeats.filter((s) => s !== seat);
        const remapped = candidates.find((c) => {
          const cExpected = expectedMap.get(c);
          return eliminatedSeats.includes(cExpected);
        });
        if (remapped) {
          predictions.push({
            seat,
            predictedOpponent: remapped,
            confidence: 40,
            method: 'reassigned',
            note: `Original opponent eliminated, rematched`,
          });
        } else {
          predictions.push({
            seat,
            predictedOpponent: candidates[0] || null,
            confidence: 30,
            method: 'fallback',
            note: `Unable to determine, best guess`,
          });
        }
      }
    } else {
      predictions.push({
        seat,
        predictedOpponent: expectedOpp,
        confidence: 85,
        method: 'standard',
        note: `Standard round-robin matchup`,
      });
    }
  }

  return predictions;
}

export function predictHybrid(activePlayers, roundNumber, eliminatedSeats) {
  const games = loadGames();
  const activeSeats = activePlayers.map((p) => p.seat);

  if (games.length === 0) {
    return predictWithStandardTable(activeSeats, roundNumber, eliminatedSeats);
  }

  const dataPreds = predictFromData(games, activeSeats, roundNumber);
  const standardPreds = predictWithStandardTable(activeSeats, roundNumber, eliminatedSeats);

  const combined = dataPreds.map((dp) => {
    const sp = standardPreds.find((s) => s.seat === dp.seat);
    if (dp.confidence >= 50 && dp.predictedOpponent) {
      return { ...dp, method: 'data', confidence: Math.min(dp.confidence + 10, 100) };
    }
    if (sp && sp.confidence >= 50) {
      return { ...sp, method: 'standard', confidence: sp.confidence - 10 };
    }
    return sp || dp;
  });

  return combined;
}

export function getPredictionSummary(games, activePlayers, roundNumber) {
  const activeSeats = activePlayers.map((p) => p.seat);
  const eliminatedSeats = [1, 2, 3, 4, 5, 6, 7, 8].filter(
    (s) => !activeSeats.includes(s)
  );

  if (games.length > 0) {
    return predictFromData(games, activeSeats, roundNumber);
  }
  return predictWithStandardTable(activeSeats, roundNumber, eliminatedSeats);
}
