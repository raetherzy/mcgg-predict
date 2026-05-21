import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadGames } from '../store/gameStore';
import { getPredictionSummary } from '../algorithm/predictor';
import { getActivePlayers, getEliminatedPlayers } from '../algorithm/utils';

export default function Predict() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('id');
  const [selectedGameId, setSelectedGameId] = useState(preselectedId || '');
  const [roundNumber, setRoundNumber] = useState(1);
  const [predictions, setPredictions] = useState(null);

  const allGames = useMemo(() => loadGames(), []);

  useEffect(() => {
    if (!preselectedId && allGames.length > 0 && !selectedGameId) {
      setSelectedGameId(allGames[0].id);
    }
  }, [allGames, preselectedId, selectedGameId]);

  const selectedGame = useMemo(() => {
    return allGames.find((g) => g.id === selectedGameId) || null;
  }, [selectedGameId, allGames]);

  const activePlayers = useMemo(() => {
    if (!selectedGame) return [];
    return getActivePlayers(selectedGame.players, roundNumber - 1);
  }, [selectedGame, roundNumber]);

  const eliminatedPlayers = useMemo(() => {
    if (!selectedGame) return [];
    return getEliminatedPlayers(selectedGame.players, roundNumber - 1);
  }, [selectedGame, roundNumber]);

  const handlePredict = () => {
    if (!selectedGame) return;
    const allGamesExcept = allGames.filter((g) => g.id !== selectedGame.id);
    const preds = getPredictionSummary(allGamesExcept, activePlayers, roundNumber);

    const enriched = preds.map((p) => {
      const player = selectedGame.players.find((pl) => pl.seat === p.seat);
      const realOpponent = selectedGame.rounds
        ?.find((r) => r.roundNumber === roundNumber)
        ?.matchups?.find((m) => m.seatA === p.seat || m.seatB === p.seat);

      let actualOpponent = null;
      let wasCorrect = null;

      if (realOpponent) {
        actualOpponent = realOpponent.seatA === p.seat ? realOpponent.seatB : realOpponent.seatA;
        wasCorrect = actualOpponent === p.predictedOpponent;
      }

      return {
        ...p,
        playerName: player?.name || `P${p.seat}`,
        actualOpponent,
        opponentName: actualOpponent
          ? selectedGame.players.find((pl) => pl.seat === actualOpponent)?.name || `S${actualOpponent}`
          : null,
        wasCorrect,
        predictedName: p.predictedOpponent
          ? selectedGame.players.find((pl) => pl.seat === p.predictedOpponent)?.name || `S${p.predictedOpponent}`
          : '???',
      };
    });

    setPredictions(enriched);
  };

  const accuracy = useMemo(() => {
    if (!predictions) return null;
    const evaluable = predictions.filter((p) => p.wasCorrect !== null);
    if (evaluable.length === 0) return null;
    return Math.round((evaluable.filter((p) => p.wasCorrect).length / evaluable.length) * 100);
  }, [predictions]);

  if (allGames.length === 0) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔮</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          NO DATA
        </h1>
        <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: 20 }}>
          RECORD AT LEAST ONE GAME FIRST
        </p>
        <a href="/input" className="brutal-btn brutal-btn-neon" style={{ textDecoration: 'none', display: 'inline-block' }}>
          RECORD GAME
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 24px', color: '#fff' }}>
        PREDICT OPPONENT
      </h1>

      <div className="brutal-card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 6 }}>
              GAME
            </label>
            <select
              value={selectedGameId}
              onChange={(e) => { setSelectedGameId(e.target.value); setPredictions(null); }}
              className="brutal-select"
            >
              {allGames.map((g, idx) => (
                <option key={g.id} value={g.id}>GAME #{idx + 1}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 6 }}>
              ROUND
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={roundNumber}
              onChange={(e) => { setRoundNumber(parseInt(e.target.value) || 1); setPredictions(null); }}
              className="brutal-input"
            />
          </div>
          <button onClick={handlePredict} className="brutal-btn brutal-btn-neon brutal-btn-sm" style={{ boxShadow: '3px 3px 0 var(--color-neon-green)' }}>
            PREDICT
          </button>
        </div>

        {selectedGame && (
          <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: '0.68rem', color: '#888' }}>
            <span style={{ color: 'var(--color-neon-green)' }}>{activePlayers.length} ACTIVE</span>
            <span style={{ color: '#ff3333' }}>{eliminatedPlayers.length} ELIMINATED</span>
            <span style={{ color: 'var(--color-neon-purple)' }}>
              {activePlayers.length % 2 !== 0 ? 'GHOST REQUIRED' : 'NO GHOST'}
            </span>
          </div>
        )}
      </div>

      {predictions && (
        <>
          {accuracy !== null && (
            <div style={{
              marginBottom: 20, padding: '14px 20px', border: '3px solid',
              borderColor: accuracy >= 70 ? 'var(--color-neon-green)' : accuracy >= 40 ? 'var(--color-neon-yellow)' : '#ff3333',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{accuracy}%</span>
              <span style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase' }}>PREDICTION ACCURACY</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {predictions.map((pred) => (
              <div
                key={pred.seat}
                className="brutal-card"
                style={{
                  borderColor: pred.wasCorrect === true ? 'var(--color-neon-green)' : pred.wasCorrect === false ? '#ff3333' : '#fff',
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, border: '3px solid #fff', fontWeight: 800, fontSize: '0.8rem',
                    }}>
                      {pred.seat}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pred.playerName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pred.wasCorrect === true && (
                      <span className="brutal-badge" style={{ color: 'var(--color-neon-green)', borderColor: 'var(--color-neon-green)' }}>CORRECT</span>
                    )}
                    {pred.wasCorrect === false && (
                      <span className="brutal-badge" style={{ color: '#ff3333', borderColor: '#ff3333' }}>WRONG</span>
                    )}
                    <span className="brutal-badge" style={{ color: '#888', borderColor: '#888' }}>
                      {pred.method?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ border: '2px solid #333', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>PREDICTED</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                      {pred.predictedName}
                      <span style={{ fontSize: '0.65rem', color: '#666', marginLeft: 6 }}>
                        ({Math.round(pred.confidence)}%)
                      </span>
                    </div>
                  </div>
                  <div style={{ border: '2px solid #333', padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>ACTUAL</div>
                    <div style={{
                      fontWeight: 800, fontSize: '0.85rem',
                      color: pred.wasCorrect ? 'var(--color-neon-green)' : pred.wasCorrect === false ? '#ff3333' : '#888',
                    }}>
                      {pred.opponentName || '(not recorded)'}
                    </div>
                  </div>
                </div>

                {pred.note && (
                  <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#666', fontStyle: 'italic' }}>{pred.note}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!predictions && selectedGame && (
        <div className="brutal-card" style={{ textAlign: 'center', padding: 50 }}>
          <p style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            SELECT ROUND &amp; CLICK PREDICT
          </p>
        </div>
      )}
    </div>
  );
}
