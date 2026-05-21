import { useState, useMemo } from 'react';
import { loadGames } from '../store/gameStore';
import { buildMatchupMatrix, buildPatternSequence, detectGhostPattern, compareWithStandard } from '../algorithm/patternDiscovery';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analysis() {
  const games = useMemo(() => loadGames(), []);
  const [selectedSeat, setSelectedSeat] = useState(1);
  const [view, setView] = useState('matrix');

  const matrix = useMemo(() => games.length > 0 ? buildMatchupMatrix(games) : null, [games]);
  const sequence = useMemo(() => games.length > 0 ? buildPatternSequence(games) : null, [games]);
  const ghostData = useMemo(() => games.length > 0 ? detectGhostPattern(games) : [], [games]);
  const comparison = useMemo(() => games.length > 0 ? compareWithStandard(games) : null, [games]);

  const chartData = useMemo(() => {
    if (!sequence || !sequence[selectedSeat]) return [];
    return sequence[selectedSeat].map((s) => ({
      round: `R${s.round}`,
      opponent: s.mostLikely,
      confidence: Math.round(s.confidence / s.totalGames * 100) || 0,
    }));
  }, [sequence, selectedSeat]);

  const accuracyData = useMemo(() => {
    if (!comparison) return [];
    const grouped = {};
    for (const c of comparison) {
      const key = `R${c.round}`;
      if (!grouped[key]) grouped[key] = { round: key, accuracy: 0, count: 0 };
      grouped[key].accuracy += c.accuracy;
      grouped[key].count++;
    }
    return Object.values(grouped).map((g) => ({
      round: g.round,
      accuracy: Math.round(g.accuracy / g.count),
    }));
  }, [comparison]);

  const views = ['matrix', 'chart', 'ghosts', 'accuracy'];

  if (games.length === 0) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📈</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          NO DATA
        </h1>
        <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: 20 }}>
          RECORD GAMES FIRST
        </p>
        <a href="/input" className="brutal-btn brutal-btn-neon" style={{ textDecoration: 'none', display: 'inline-block' }}>
          RECORD GAME
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 24px', color: '#fff' }}>
        PATTERN ANALYSIS
      </h1>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, flexWrap: 'wrap' }}>
        {views.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '8px 16px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: 1,
              border: '2px solid',
              borderColor: view === v ? 'var(--color-neon-green)' : '#444',
              background: view === v ? 'rgba(0,255,65,0.08)' : 'transparent',
              color: view === v ? 'var(--color-neon-green)' : '#888',
              cursor: 'pointer',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'matrix' && matrix && (
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            MATCHUP MATRIX — SEAT {selectedSeat}
          </h3>
          <p style={{ color: '#666', fontSize: '0.65rem', marginBottom: 16 }}>
            OPPONENT FREQUENCY PER ROUND
          </p>

          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeat(s)}
                style={{
                  width: 36, height: 36, border: '3px solid',
                  borderColor: selectedSeat === s ? 'var(--color-neon-green)' : '#444',
                  background: selectedSeat === s ? 'rgba(0,255,65,0.1)' : 'transparent',
                  color: selectedSeat === s ? 'var(--color-neon-green)' : '#aaa',
                  fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="brutal-table">
              <thead>
                <tr>
                  <th>ROUND</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <th key={s} style={{ textAlign: 'center' }}>S{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((round) => {
                  const hasData = Object.values(matrix[selectedSeat]?.[round] || {}).some((v) => v > 0);
                  if (!hasData) return null;
                  const maxCount = Math.max(...Object.values(matrix[selectedSeat]?.[round] || {}), 1);
                  return (
                    <tr key={round}>
                      <td style={{ fontWeight: 700 }}>R{round}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((opp) => {
                        const count = matrix[selectedSeat]?.[round]?.[opp] || 0;
                        return (
                          <td
                            key={opp}
                            style={{
                              textAlign: 'center',
                              background: count > 0 ? `rgba(0,255,65,${0.07 + (count / maxCount) * 0.25})` : 'transparent',
                              color: count > 0 ? 'var(--color-neon-green)' : '#444',
                              fontWeight: count > 0 ? 700 : 400,
                            }}
                          >
                            {count > 0 ? count : '·'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'chart' && chartData.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            OPPONENT PATTERN — SEAT {selectedSeat}
          </h3>
          <p style={{ color: '#666', fontSize: '0.65rem', marginBottom: 16 }}>
            MOST FREQUENT OPPONENT PER ROUND
          </p>

          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeat(s)}
                style={{
                  width: 36, height: 36, border: '3px solid',
                  borderColor: selectedSeat === s ? 'var(--color-neon-green)' : '#444',
                  background: selectedSeat === s ? 'rgba(0,255,65,0.1)' : 'transparent',
                  color: selectedSeat === s ? 'var(--color-neon-green)' : '#aaa',
                  fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="brutal-card" style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="round" stroke="#666" fontSize={11} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="#666" fontSize={11} fontFamily="JetBrains Mono, monospace" domain={[0, 8]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '2px solid #444', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  labelStyle={{ color: '#aaa', fontWeight: 700 }}
                />
                <Line type="stepAfter" dataKey="opponent" name="OPPONENT" stroke="#00ff41" strokeWidth={2} dot={{ fill: '#00ff41', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'ghosts' && (
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            GHOST MIRROR HISTORY
          </h3>
          {ghostData.length === 0 ? (
            <div className="brutal-card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#888', fontSize: '0.75rem' }}>NO GHOST DATA DETECTED</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="brutal-table">
                <thead>
                  <tr>
                    <th>ROUND</th>
                    <th>GHOST SEAT</th>
                    <th>VS</th>
                  </tr>
                </thead>
                <tbody>
                  {ghostData.map((g, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>R{g.round}</td>
                      <td style={{ color: 'var(--color-neon-purple)', fontWeight: 700 }}>SEAT {g.ghostSeat}</td>
                      <td>SEAT {g.realOpponent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'accuracy' && accuracyData.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            VS STANDARD ROUND-ROBIN
          </h3>
          <p style={{ color: '#666', fontSize: '0.65rem', marginBottom: 16 }}>
            DATA MATCH WITH BERGER TABLE (%)
          </p>

          <div className="brutal-card" style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="round" stroke="#666" fontSize={11} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="#666" fontSize={11} fontFamily="JetBrains Mono, monospace" domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#111', border: '2px solid #444', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  labelStyle={{ color: '#aaa', fontWeight: 700 }}
                  formatter={(value) => [`${value}%`, 'ACCURACY']}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#00ffff" strokeWidth={2} dot={{ fill: '#00ffff', r: 4 }} name="ACCURACY" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
