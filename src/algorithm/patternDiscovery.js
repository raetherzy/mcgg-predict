import { loadGames } from '../store/gameStore';

function getMatchupForSeatInRound(game, seat, roundNumber) {
  const round = game.rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) return null;
  const m = round.matchups.find((ma) => ma.seatA === seat || ma.seatB === seat);
  if (!m) return null;
  if (m.seatA === seat) return { opponent: m.seatB, isGhostB: m.isGhostB };
  return { opponent: m.seatA, isGhostB: m.isGhostA };
}

function isPlayerAlive(game, seat, atRound) {
  const p = game.players.find((pl) => pl.seat === seat);
  if (!p) return false;
  return p.eliminatedAtRound === null || p.eliminatedAtRound > atRound;
}

export function buildMatchupMatrix(games) {
  const matrix = {};
  for (let seat = 1; seat <= 8; seat++) {
    matrix[seat] = {};
    for (let round = 1; round <= 30; round++) {
      matrix[seat][round] = {};
    }
  }

  for (const game of games) {
    for (const round of game.rounds) {
      const rn = round.roundNumber;
      for (const m of round.matchups) {
        if (isPlayerAlive(game, m.seatA, rn - 1) && !m.isGhostA) {
          matrix[m.seatA][rn][m.seatB] = (matrix[m.seatA][rn][m.seatB] || 0) + 1;
        }
        if (isPlayerAlive(game, m.seatB, rn - 1) && !m.isGhostB) {
          matrix[m.seatB][rn][m.seatA] = (matrix[m.seatB][rn][m.seatA] || 0) + 1;
        }
      }
    }
  }

  return matrix;
}

export function buildPatternSequence(games) {
  const sequence = {};
  for (let seat = 1; seat <= 8; seat++) {
    sequence[seat] = [];
  }

  const matrix = buildMatchupMatrix(games);
  for (let seat = 1; seat <= 8; seat++) {
    for (let round = 1; round <= 30; round++) {
      const opponents = matrix[seat][round];
      const entries = Object.entries(opponents);
      if (entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        sequence[seat].push({
          round,
          mostLikely: parseInt(entries[0][0]),
          confidence: entries[0][1],
          totalGames: entries.reduce((sum, [, c]) => sum + c, 0),
        });
      }
    }
  }

  return sequence;
}

export function detectGhostPattern(games) {
  const ghostData = [];

  for (const game of games) {
    for (const round of game.rounds) {
      for (const m of round.matchups) {
        if (m.isGhostA || m.isGhostB) {
          const ghostSeat = m.isGhostA ? m.seatA : m.seatB;
          const realSeat = m.isGhostA ? m.seatB : m.seatA;
          const ghostOf = game.players.find((p) => p.seat === ghostSeat);
          ghostData.push({
            gameId: game.id,
            round: round.roundNumber,
            ghostSeat,
            realOpponent: realSeat,
            ghostOriginalSeat: ghostSeat,
          });
        }
      }
    }
  }

  return ghostData;
}

export function computeRoundRobinMatrix() {
  const standard = {};
  const n = 8;
  for (let round = 1; round <= n - 1; round++) {
    standard[round] = [];
    for (let i = 1; i <= n / 2; i++) {
      let a, b;
      if (i === 1) {
        a = 1;
        b = n;
      } else {
        const adjusted = (round + i - 2) % (n - 1) + 1;
        let opponent = (n - 1 + round - i + 1) % (n - 1) + 1;
        if (opponent === adjusted) {
          opponent = n;
        }
        a = adjusted === n ? n : (adjusted === 1 && round !== 1 ? n : adjusted);
      }
      if (i === 1) {
        a = 1;
        b = ((n - round + 1) % (n - 1));
        if (b <= 1) b += n - 1;
        if (b > n) b = b - n + 1;
        if (b === 1) b = n;
        b = round === 1 ? n : b;
      } else {
        a = ((round + i - 2) % (n - 1)) + 2;
        if (a > 8) a = a - 7;
        b = ((round + n - i - 1) % (n - 1)) + 2;
        if (b > 8) b = b - 7;
        if (a === b) b = 1;
      }
      standard[round].push({ seatA: a, seatB: b });
    }
  }

  return standard;
}

export function computeStandardBergerTable() {
  const n = 8;
  const table = {};

  for (let round = 1; round <= n - 1; round++) {
    table[round] = [];
    for (let i = 1; i <= n / 2; i++) {
      let a, b;
      if (i === 1) {
        if (round % 2 === 1) {
          a = 1;
          b = (n - round);
          if (b <= 1) b = n;
        } else {
          b = 1;
          a = (n - round + 2);
          if (a > n) a = a - n + 1;
        }
      } else {
        const offset = i - 2;
        a = ((round + offset) % (n - 1)) + 2;
        if (a > n) a = a - n + 1;
        b = ((round + (n - 2) - offset) % (n - 1)) + 2;
        if (b > n) b = b - n + 1;
        if (a === b) {
          if (round % 2 === 1) {
            a = 1;
            b = (n - round);
            if (b <= 1) b = n;
          } else {
            b = 1;
            a = (n - round + 2);
            if (a > n) a = a - n + 1;
          }
        }
      }
      table[round].push({ seatA: Math.min(a, b), seatB: Math.max(a, b) });
    }
  }
  return table;
}

export function compareWithStandard(games) {
  const matrix = buildMatchupMatrix(games);
  const standard = computeStandardBergerTable();
  const results = [];

  for (let round = 1; round <= 7; round++) {
    const pairs = standard[round] || [];
    const expected = new Map();
    for (const pair of pairs) {
      expected.set(pair.seatA, pair.seatB);
      expected.set(pair.seatB, pair.seatA);
    }

    for (let seat = 1; seat <= 8; seat++) {
      const actual = matrix[seat][round];
      const expectedOpp = expected.get(seat);
      if (expectedOpp !== undefined) {
        const match = actual[expectedOpp] || 0;
        const total = Object.values(actual).reduce((s, c) => s + c, 0);
        results.push({
          seat,
          round,
          expectedOpponent: expectedOpp,
          matchCount: match,
          totalGames: total,
          accuracy: total > 0 ? (match / total) * 100 : 0,
        });
      }
    }
  }

  return results;
}
