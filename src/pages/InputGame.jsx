import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addGame } from '../store/gameStore';
import { getActivePlayers } from '../algorithm/utils';
import SeatGrid from '../components/SeatGrid';

const DEFAULT_PLAYER_NAME = ['', '', '', '', '', '', '', ''];
const SEATS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function InputGame() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [players, setPlayers] = useState(
    SEATS.map((s) => ({
      seat: s,
      name: DEFAULT_PLAYER_NAME[s - 1],
      eliminatedAtRound: null,
    }))
  );
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);

  const activePlayers = getActivePlayers(players, currentRound - 1);

  const [matchups, setMatchups] = useState(
    activePlayers.map((p) => ({
      seat: p.seat,
      opponentSeat: null,
      isGhost: false,
    }))
  );

  const [eliminatedThisRound, setEliminatedThisRound] = useState([]);

  const handlePlayerNameChange = (seat, name) => {
    setPlayers((prev) => prev.map((p) => (p.seat === seat ? { ...p, name } : p)));
  };

  const handleOpponentSelect = (seat, opponentSeat) => {
    setMatchups((prev) => {
      const prevMe = prev.find((m) => m.seat === seat);
      const myOldOpponent = prevMe?.opponentSeat;

      const updated = prev.map((m) => {
        if (m.seat === seat) return { ...m, opponentSeat };
        if (m.seat === opponentSeat) return { ...m, opponentSeat: seat };
        if (m.seat === myOldOpponent) return { ...m, opponentSeat: null };
        return m;
      });

      return updated;
    });
  };

  const handleGhostToggle = (seat) => {
    setMatchups((prev) =>
      prev.map((m) => (m.seat === seat ? { ...m, isGhost: !m.isGhost } : m))
    );
  };

  const handleEliminationToggle = (seat) => {
    setEliminatedThisRound((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const allMatchupsSet = matchups.every((m) => {
    if (eliminatedThisRound.includes(m.seat)) return true;
    return m.opponentSeat !== null;
  });

  const ghostCount = matchups.filter((m) => m.isGhost).length;
  const isOddActive = activePlayers.length % 2 !== 0;
  const ghostValidationOk = !isOddActive || ghostCount === 1;

  const handleAddRound = () => {
    const matchupPairs = [];
    const processed = new Set();
    const eliminatedSeats = [1, 2, 3, 4, 5, 6, 7, 8].filter(
      (s) => !activePlayers.find((p) => p.seat === s)
    );
    let ghostSlotIdx = 0;

    for (const m of matchups) {
      if (eliminatedThisRound.includes(m.seat)) continue;
      if (processed.has(m.seat)) continue;

      const seatA = m.seat;
      let seatB = m.opponentSeat;
      const ghostA = m.isGhost;
      let ghostB = false;
      let ghostCopyOf = null;

      if (m.isGhost) {
        ghostB = true;
        ghostCopyOf = seatB;
        if (ghostSlotIdx < eliminatedSeats.length) {
          seatB = eliminatedSeats[ghostSlotIdx];
          ghostSlotIdx++;
        }
      } else {
        const opponentRow = matchups.find((x) => x.seat === seatB);
        ghostB = opponentRow?.isGhost || false;
        if (ghostB) {
          ghostCopyOf = seatA;
          if (ghostSlotIdx < eliminatedSeats.length) {
            const realOpp = seatB;
            seatB = eliminatedSeats[ghostSlotIdx];
            ghostSlotIdx++;
            ghostCopyOf = realOpp;
          }
        }
      }

      processed.add(seatA);
      processed.add(m.opponentSeat);

      matchupPairs.push({
        seatA,
        seatB,
        isGhostA: ghostA,
        isGhostB: ghostB,
        ghostCopyOf,
      });
    }

    const updatedPlayers = players.map((p) =>
      eliminatedThisRound.includes(p.seat)
        ? { ...p, eliminatedAtRound: currentRound }
        : p
    );

    setRounds((prev) => [
      ...prev,
      {
        roundNumber: currentRound,
        matchups: matchupPairs,
        eliminations: [...eliminatedThisRound],
      },
    ]);

    setPlayers(updatedPlayers);
    setCurrentRound((prev) => prev + 1);
    setEliminatedThisRound([]);

    const stillActive = updatedPlayers.filter(
      (p) => p.eliminatedAtRound === null || p.eliminatedAtRound > currentRound
    );

    if (stillActive.length <= 1) {
      handleFinish(updatedPlayers);
      return;
    }

    setMatchups(
      stillActive.map((p) => ({
        seat: p.seat,
        opponentSeat: null,
        isGhost: false,
      }))
    );
  };

  const handleFinish = (finalPlayers) => {
    const pl = finalPlayers || players;
    addGame({
      players: pl,
      rounds,
    });
    navigate('/');
  };

  const handleSkipRound = () => {
    setCurrentRound((prev) => prev + 1);
    setEliminatedThisRound([]);
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Record New Game</h1>
            <p className="text-gray-400 text-sm mt-1">Step 1: Enter 8 player names</p>
          </div>
          <span className="text-xs text-gray-500 bg-surface px-3 py-1 rounded-full">Step 1/2</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {players.map((player) => (
            <div key={player.seat} className="bg-surface border border-gray-700 rounded-xl p-4">
              <label className="block text-xs text-gray-400 mb-1.5">
                Seat {player.seat}
              </label>
              <input
                type="text"
                maxLength={20}
                value={player.name}
                onChange={(e) => handlePlayerNameChange(player.seat, e.target.value)}
                placeholder={`Player ${player.seat}`}
                className="w-full bg-surface-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
          >
            Next: Record Rounds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Record Rounds</h1>
          <p className="text-gray-400 text-sm mt-1">
            Round {currentRound} &mdash; {activePlayers.length} players active
            {isOddActive && (
              <span className="text-ghost ml-2">
                &bull; 1 ghost required ({ghostCount} checked)
              </span>
            )}
            {!isOddActive && ghostCount > 0 && (
              <span className="text-yellow-400 ml-2">&bull; Ghost checked but not needed</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep(1)}
            className="px-3 py-1.5 bg-surface border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Edit Players
          </button>
          <button
            onClick={handleSkipRound}
            className="px-3 py-1.5 bg-surface border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Skip Round
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Matchups (Round {currentRound})</h3>
          <div className="space-y-2">
            {matchups.map((mu) => {
              const player = players.find((p) => p.seat === mu.seat);
              const isElim = eliminatedThisRound.includes(mu.seat);
              const availableOpponents = activePlayers.filter(
                (ap) =>
                  ap.seat !== mu.seat &&
                  !eliminatedThisRound.includes(ap.seat)
              );

              const takenSeats = new Set();
              for (const m of matchups) {
                if (m.seat === mu.seat) continue;
                if (m.opponentSeat !== null) {
                  takenSeats.add(m.seat);
                  takenSeats.add(m.opponentSeat);
                }
              }

              const filteredOpponents = availableOpponents.filter(
                (ap) => !takenSeats.has(ap.seat) || ap.seat === mu.opponentSeat
              );

              return (
                <div
                  key={mu.seat}
                  className={`bg-surface border rounded-xl p-4 transition-colors ${
                    isElim ? 'border-red-800 opacity-50' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-light text-xs font-bold text-white">
                        {mu.seat}
                      </span>
                      <span className="text-white text-sm font-medium">
                        {player?.name || `Player ${mu.seat}`}
                      </span>
                    </div>
                    {isElim ? (
                      <span className="text-red-400 text-xs font-medium">Eliminated</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer" title="Check if opponent is a ghost/mirror copy">
                          <input
                            type="checkbox"
                            checked={mu.isGhost}
                            onChange={() => handleGhostToggle(mu.seat)}
                            className="w-3.5 h-3.5 accent-ghost rounded"
                          />
                          <span className="text-xs text-gray-400">Mirror</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isElim}
                            onChange={() => handleEliminationToggle(mu.seat)}
                            className="w-3.5 h-3.5 accent-danger rounded"
                          />
                          <span className="text-xs text-red-400">Elim</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {!isElim && (
                    <select
                      value={mu.opponentSeat || ''}
                      onChange={(e) => handleOpponentSelect(mu.seat, parseInt(e.target.value) || null)}
                      className="w-full bg-surface-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select opponent...</option>
                      {filteredOpponents.map((ap) => (
                        <option key={ap.seat} value={ap.seat}>
                          S{ap.seat}: {players.find((p) => p.seat === ap.seat)?.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Board Visualization</h3>
          <SeatGrid
            players={players}
            onSelect={() => {}}
            disabled
          />
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Active
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Eliminated
            </span>
            <span className="flex items-center gap-1 text-ghost">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Ghost
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-gray-700 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Recorded Rounds ({rounds.length})
        </h3>
        {rounds.length === 0 ? (
          <p className="text-gray-500 text-sm">No rounds recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rounds.map((r) => (
              <div key={r.roundNumber} className="flex items-center gap-3 text-sm">
                <span className="text-primary font-medium min-w-[60px]">Round {r.roundNumber}</span>
                <span className="text-gray-400">
                  {r.matchups.map((m) => {
                    const aName = players.find((p) => p.seat === m.seatA)?.name || `S${m.seatA}`;
                    const bName = players.find((p) => p.seat === m.seatB)?.name || `S${m.seatB}`;
                    const ghostNote = m.isGhostA
                      ? ` (mirror from S${m.seatB})`
                      : m.isGhostB
                      ? ` (mirror from S${m.seatA})`
                      : '';
                    return `${aName} vs ${bName}${ghostNote}`;
                  }).join(', ')}
                </span>
                {r.eliminations.length > 0 && (
                  <span className="text-red-400 text-xs">
                    Eliminated: {r.eliminations.map((s) => players.find((p) => p.seat === s)?.name).join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => handleFinish()}
          className="px-4 py-2 bg-surface border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-sm transition-colors"
        >
          Finish Game
        </button>
        <button
          onClick={handleAddRound}
          disabled={!allMatchupsSet || !ghostValidationOk}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors text-sm ${
            allMatchupsSet && ghostValidationOk
              ? 'bg-primary hover:bg-primary-dark text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {activePlayers.filter((p) => !eliminatedThisRound.includes(p.seat)).length <= 1
            ? 'Finish Game'
            : `Save Round ${currentRound} & Next`}
        </button>
      </div>
    </div>
  );
}
