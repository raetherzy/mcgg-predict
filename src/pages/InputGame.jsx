import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addGame } from '../store/gameStore';
import { getActivePlayers } from '../algorithm/utils';

const SEATS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function InputGame() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [players, setPlayers] = useState(
    SEATS.map((s) => ({ seat: s, name: '', eliminatedAtRound: null }))
  );
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [eliminatedThisRound, setEliminatedThisRound] = useState([]);
  const [ghostCopySeat, setGhostCopySeat] = useState(null);
  const [selections, setSelections] = useState({});

  const activePlayers = useMemo(
    () => getActivePlayers(players, currentRound - 1),
    [players, currentRound]
  );

  const activeNonElim = useMemo(
    () => activePlayers.filter((ap) => !eliminatedThisRound.includes(ap.seat)),
    [activePlayers, eliminatedThisRound]
  );

  const isOdd = activeNonElim.length % 2 !== 0;

  useEffect(() => {
    setSelections({});
    setGhostCopySeat(null);
    setEliminatedThisRound([]);
  }, [currentRound]);

  const matchups = useMemo(() => {
    return activePlayers.map((p) => ({
      seat: p.seat,
      opponentSeat: selections[p.seat] ?? null,
    }));
  }, [activePlayers, selections]);

  const takenSeats = useMemo(() => {
    const s = new Set();
    for (const m of matchups) {
      if (m.opponentSeat !== null && m.opponentSeat !== 'ghost') {
        s.add(m.seat);
        s.add(m.opponentSeat);
      }
    }
    return s;
  }, [matchups]);

  const ghostIsTaken = useMemo(() => {
    return matchups.some((m) => m.opponentSeat === 'ghost');
  }, [matchups]);

  const allMatchupsSet = useMemo(() => {
    if (activePlayers.length <= 1) return true;
    const everyonePaired = matchups
      .filter((m) => !eliminatedThisRound.includes(m.seat))
      .every((m) => m.opponentSeat !== null);
    const ghostOk = !isOdd || (ghostCopySeat !== null && ghostIsTaken);
    return everyonePaired && ghostOk;
  }, [matchups, eliminatedThisRound, isOdd, ghostCopySeat, ghostIsTaken, activePlayers]);

  const handlePlayerNameChange = (seat, name) => {
    setPlayers((prev) => prev.map((p) => (p.seat === seat ? { ...p, name } : p)));
  };

  const handleOpponentSelect = (seat, opponentSeat) => {
    setSelections((prev) => {
      const myOldOpponent = prev[seat];

      const next = { ...prev, [seat]: opponentSeat };

      if (opponentSeat !== 'ghost' && typeof opponentSeat === 'number') {
        next[opponentSeat] = seat;
      }

      if (myOldOpponent && myOldOpponent !== opponentSeat) {
        if (typeof myOldOpponent === 'number') {
          if (next[myOldOpponent] === seat) {
            delete next[myOldOpponent];
          }
        }
      }

      Object.keys(next).forEach((k) => {
        const s = parseInt(k);
        if (!isNaN(s) && !activePlayers.find((ap) => ap.seat === s)) {
          delete next[k];
        }
      });

      return next;
    });
  };

  const handleEliminationToggle = (seat) => {
    setEliminatedThisRound((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const handleAddRound = () => {
    const allSeats = [1, 2, 3, 4, 5, 6, 7, 8];
    const eliminatedSeats = allSeats.filter(
      (s) => !activePlayers.find((p) => p.seat === s) && !eliminatedThisRound.includes(s)
    );

    const matchupPairs = [];
    const processed = new Set();
    let ghostSlotIdx = 0;

    for (const m of matchups) {
      if (eliminatedThisRound.includes(m.seat)) continue;
      if (processed.has(m.seat)) continue;
      if (m.opponentSeat === null) continue;

      let seatB = m.opponentSeat;
      let isGhostB = false;
      let ghostCopyOf = null;

      if (seatB === 'ghost') {
        isGhostB = true;
        ghostCopyOf = ghostCopySeat;
        seatB = eliminatedSeats.length > ghostSlotIdx ? eliminatedSeats[ghostSlotIdx] : 999;
        ghostSlotIdx++;
      }

      processed.add(m.seat);
      if (typeof seatB === 'number') {
        processed.add(seatB);
      }

      matchupPairs.push({
        seatA: m.seat,
        seatB,
        isGhostA: false,
        isGhostB,
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

    const stillActive = updatedPlayers.filter((p) => p.eliminatedAtRound === null);
    if (stillActive.length <= 1) {
      const finalRounds = [...rounds, {
        roundNumber: currentRound,
        matchups: matchupPairs,
        eliminations: [...eliminatedThisRound],
      }];
      addGame({ players: updatedPlayers, rounds: finalRounds });
      navigate('/');
      return;
    }

    setSelections({});
    setGhostCopySeat(null);
    setEliminatedThisRound([]);
  };

  const handleSkipRound = () => {
    setCurrentRound((prev) => prev + 1);
  };

  const handleFinish = () => {
    addGame({ players, rounds });
    navigate('/');
  };

  if (step === 1) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: 0, color: '#fff' }}>
              RECORD GAME
            </h1>
            <p style={{ color: '#666', marginTop: 4, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
              Step 1 &mdash; Enter player names
            </p>
          </div>
          <span className="brutal-badge" style={{ color: '#666', borderColor: '#666' }}>1/2</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {players.map((player) => (
            <div key={player.seat} className="brutal-card" style={{ padding: 14 }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 6 }}>
                SEAT {player.seat}
              </div>
              <input
                type="text"
                maxLength={20}
                value={player.name}
                onChange={(e) => handlePlayerNameChange(player.seat, e.target.value)}
                placeholder={`Player ${player.seat}...`}
                className="brutal-input"
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setStep(2)} className="brutal-btn brutal-btn-neon">
            NEXT: RECORD ROUNDS &gt;&gt;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: 0, color: '#fff' }}>
            ROUND {currentRound}
          </h1>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1 }}>
              {activeNonElim.length} ACTIVE
            </span>
            {isOdd && (
              <span className="brutal-badge" style={{ color: 'var(--color-neon-purple)', borderColor: 'var(--color-neon-purple)' }}>
                GHOST REQUIRED
              </span>
            )}
            {!isOdd && (
              <span className="brutal-badge" style={{ color: '#666', borderColor: '#666' }}>
                NO GHOST
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setStep(1)} className="brutal-btn brutal-btn-sm" style={{ boxShadow: '3px 3px 0px #fff' }}>
            EDIT NAMES
          </button>
          <button onClick={handleSkipRound} className="brutal-btn brutal-btn-sm" style={{ boxShadow: '3px 3px 0px #fff' }}>
            SKIP ROUND
          </button>
        </div>
      </div>

      {isOdd && (
        <div className="brutal-card brutal-card-ghost" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>👻</span>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--color-neon-purple)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                  GHOST MIRROR
                </div>
                <div style={{ fontSize: '0.65rem', color: '#888' }}>
                  {ghostIsTaken ? 'PAIRED' : 'waiting for opponent...'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Copies:</span>
              <select
                value={ghostCopySeat || ''}
                onChange={(e) => setGhostCopySeat(e.target.value ? parseInt(e.target.value) : null)}
                className="brutal-select"
                style={{ width: 220, fontSize: '0.78rem' }}
              >
                <option value="">Select player...</option>
                {activePlayers.map((ap) => (
                  <option key={ap.seat} value={ap.seat}>
                    S{ap.seat}: {ap.name || `Player ${ap.seat}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {matchups.map((mu) => {
          const player = players.find((p) => p.seat === mu.seat);
          const isElim = eliminatedThisRound.includes(mu.seat);
          const isTaken = takenSeats.has(mu.seat);
          const isGhostOpponent = mu.opponentSeat === 'ghost';

          const availableOpponents = activePlayers.filter(
            (ap) => ap.seat !== mu.seat && !eliminatedThisRound.includes(ap.seat)
          );

          const filteredOpponents = availableOpponents.filter(
            (ap) => !takenSeats.has(ap.seat) || ap.seat === mu.opponentSeat
          );

          if (isOdd && !ghostIsTaken) {
            filteredOpponents.push({ seat: 'ghost', name: 'GHOST MIRROR' });
          }

          return (
            <div
              key={mu.seat}
              className={`brutal-card ${isElim ? 'brutal-card-danger' : ''}`}
              style={{ padding: 14, opacity: isElim ? 0.4 : 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, border: '2px solid #fff', fontSize: '0.7rem', fontWeight: 800,
                    color: isElim ? '#ff3333' : isTaken ? 'var(--color-neon-green)' : '#fff',
                    background: isElim ? 'rgba(255,51,51,0.1)' : isTaken ? 'rgba(0,255,65,0.1)' : 'transparent',
                  }}>
                    {mu.seat}
                  </span>
                  <div>
                    <span style={{
                      fontWeight: 700, fontSize: '0.85rem',
                      color: isElim ? '#ff3333' : '#fff',
                      textDecoration: isElim ? 'line-through' : 'none',
                    }}>
                      {player?.name || `Player ${mu.seat}`}
                    </span>
                    {isTaken && !isGhostOpponent && !isElim && (
                      <span className="brutal-badge" style={{ color: 'var(--color-neon-green)', borderColor: 'var(--color-neon-green)', marginLeft: 8 }}>
                        PAIRED
                      </span>
                    )}
                    {isGhostOpponent && (
                      <span className="brutal-badge" style={{ color: 'var(--color-neon-purple)', borderColor: 'var(--color-neon-purple)', marginLeft: 8 }}>
                        VS GHOST
                      </span>
                    )}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.65rem', color: '#ff3333', textTransform: 'uppercase', letterSpacing: 1 }}>ELIM</span>
                  <input
                    type="checkbox"
                    checked={isElim}
                    onChange={() => handleEliminationToggle(mu.seat)}
                    className="brutal-checkbox brutal-checkbox-danger"
                  />
                </label>
              </div>

              {!isElim && (
                <select
                  value={mu.opponentSeat || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleOpponentSelect(mu.seat, val === 'ghost' ? 'ghost' : val ? parseInt(val) : null);
                  }}
                  className="brutal-select"
                >
                  <option value="">-- SELECT OPPONENT --</option>
                  {filteredOpponents.map((ap) => {
                    const isGhostOpt = ap.seat === 'ghost';
                    const optPlayer = players.find((p) => p.seat === ap.seat);
                    return (
                      <option key={isGhostOpt ? 'ghost' : ap.seat} value={isGhostOpt ? 'ghost' : ap.seat}>
                        {isGhostOpt ? '👻 GHOST MIRROR' : `S${ap.seat}: ${optPlayer?.name || `Player ${ap.seat}`}`}
                      </option>
                    );
                  })}
                </select>
              )}

              {isElim && (
                <div className="brutal-input" style={{ color: '#ff3333', textAlign: 'center', opacity: 0.5 }}>
                  ELIMINATED
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rounds.length > 0 && (
        <div className="brutal-card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 10 }}>
            RECORDED ROUNDS ({rounds.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto', fontSize: '0.72rem' }}>
            {rounds.map((r) => (
              <div key={r.roundNumber} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid #222' }}>
                <span style={{ color: 'var(--color-neon-green)', fontWeight: 700, minWidth: 60 }}>R{r.roundNumber}</span>
                <span style={{ color: '#aaa', flex: 1 }}>
                  {r.matchups.map((m) => {
                    const aName = players.find((p) => p.seat === m.seatA)?.name || `S${m.seatA}`;
                    const isGhost = m.isGhostA || m.isGhostB;
                    let bName;
                    let ghostNote = '';
                    if (isGhost && m.ghostCopyOf) {
                      const copiedName = players.find((p) => p.seat === m.ghostCopyOf)?.name || `S${m.ghostCopyOf}`;
                      bName = `👻(${copiedName})`;
                    } else {
                      bName = players.find((p) => p.seat === m.seatB)?.name || `S${m.seatB}`;
                    }
                    return `${aName} vs ${bName}${ghostNote}`;
                  }).join('  |  ')}
                </span>
                {r.eliminations.length > 0 && (
                  <span style={{ color: '#ff3333', fontSize: '0.65rem' }}>
                    -{r.eliminations.map((s) => players.find((p) => p.seat === s)?.name).join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleFinish} className="brutal-btn brutal-btn-sm" style={{ boxShadow: '3px 3px 0px #fff' }}>
          FINISH GAME
        </button>
        <button
          onClick={handleAddRound}
          disabled={!allMatchupsSet}
          className={`brutal-btn ${allMatchupsSet ? 'brutal-btn-neon' : ''}`}
        >
          {activeNonElim.length <= 1 ? 'FINISH GAME' : `SAVE ROUND ${currentRound} →`}
        </button>
      </div>
    </div>
  );
}
