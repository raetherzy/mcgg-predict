export function getActivePlayers(players, atRound) {
  return players.filter(
    (p) => p.eliminatedAtRound === null || p.eliminatedAtRound > atRound
  );
}

export function getEliminatedPlayers(players, atRound) {
  return players.filter(
    (p) => p.eliminatedAtRound !== null && p.eliminatedAtRound <= atRound
  );
}

export function getMatchupForSeat(round, seat) {
  if (!round) return null;
  const matchup = round.matchups.find(
    (m) => m.seatA === seat || m.seatB === seat
  );
  if (!matchup) return null;
  if (matchup.seatA === seat) {
    return { opponent: matchup.seatB, isGhost: matchup.isGhostB };
  }
  return { opponent: matchup.seatA, isGhost: matchup.isGhostA };
}

export function getActivePlayerCount(players, atRound) {
  return getActivePlayers(players, atRound).length;
}

export function needsGhost(players, roundNumber) {
  return getActivePlayerCount(players, roundNumber) % 2 !== 0;
}

export function isOdd(num) {
  return num % 2 !== 0;
}
