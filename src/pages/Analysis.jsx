import { useState, useMemo } from 'react';
import { loadGames } from '../store/gameStore';
import {
  buildMatchupMatrix,
  computeStandardBergerTable,
  compareWithStandard,
  detectGhostPattern,
  buildPatternSequence,
} from '../algorithm/patternDiscovery';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analysis() {
  const games = useMemo(() => loadGames(), []);
  const [selectedSeat, setSelectedSeat] = useState(1);
  const [view, setView] = useState('matrix');

  const matrix = useMemo(() => {
    if (games.length === 0) return null;
    return buildMatchupMatrix(games);
  }, [games]);

  const sequence = useMemo(() => {
    if (games.length === 0) return null;
    return buildPatternSequence(games);
  }, [games]);

  const standard = useMemo(() => computeStandardBergerTable(), []);
  const comparison = useMemo(() => {
    if (games.length === 0) return null;
    return compareWithStandard(games);
  }, [games]);
  const ghostData = useMemo(() => {
    if (games.length === 0) return [];
    return detectGhostPattern(games);
  }, [games]);

  const chartData = useMemo(() => {
    if (!sequence || !sequence[selectedSeat]) return [];
    return sequence[selectedSeat].map((s) => ({
      round: s.round,
      opponent: s.mostLikely,
      confidence: Math.round(s.confidence / s.totalGames * 100) || 0,
    }));
  }, [sequence, selectedSeat]);

  const accuracyData = useMemo(() => {
    if (!comparison) return [];
    const grouped = {};
    for (const c of comparison) {
      const key = `Round ${c.round}`;
      if (!grouped[key]) grouped[key] = { round: key, accuracy: 0, count: 0 };
      grouped[key].accuracy += c.accuracy;
      grouped[key].count++;
    }
    return Object.values(grouped).map((g) => ({
      round: g.round,
      accuracy: Math.round(g.accuracy / g.count),
    }));
  }, [comparison]);

  if (games.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-5xl mb-4">📈</p>
        <h1 className="text-2xl font-bold text-white mb-2">No Analysis Data</h1>
        <p className="text-gray-400 mb-4">Record games first to see pattern analysis.</p>
        <a
          href="/input"
          className="inline-block px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
        >
          Record Game Now
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Pattern Analysis</h1>

      <div className="flex gap-2 mb-6">
        {['matrix', 'chart', 'ghosts', 'accuracy'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              view === v
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-surface border border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'matrix' && matrix && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Matchup Matrix (Opponent Frequency)</h3>
          <p className="text-sm text-gray-400 mb-4">
            Shows how many times each seat faced each opponent per round across all recorded games.
          </p>

          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeat(s)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                  selectedSeat === s
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                S{s}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-surface-dark text-gray-400 font-medium border-b border-gray-700 sticky left-0">
                    Round
                  </th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <th key={s} className="p-3 bg-surface-dark text-gray-400 font-medium border-b border-gray-700 text-center">
                      S{s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((round) => {
                  const hasData = Object.values(matrix[selectedSeat]?.[round] || {}).some((v) => v > 0);
                  if (!hasData) return null;
                  return (
                    <tr key={round} className="border-b border-gray-800 hover:bg-surface/50">
                      <td className="p-3 text-gray-300 font-medium sticky left-0 bg-surface-dark border-r border-gray-800">
                        R{round}
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((opp) => {
                        const count = matrix[selectedSeat]?.[round]?.[opp] || 0;
                        const maxCount = Math.max(
                          ...Object.values(matrix[selectedSeat]?.[round] || {}),
                          1
                        );
                        const intensity = count > 0 ? count / maxCount : 0;
                        return (
                          <td
                            key={opp}
                            className="p-3 text-center"
                            style={{
                              backgroundColor: count > 0
                                ? `rgba(168, 85, 247, ${0.1 + intensity * 0.5})`
                                : 'transparent',
                              color: count > 0 ? '#d8b4fe' : '#4b5563',
                            }}
                          >
                            {count > 0 ? count : '-'}
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
          <h3 className="text-lg font-semibold text-white mb-2">
            Opponent Pattern — Seat {selectedSeat}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Most frequent opponent for Seat {selectedSeat} per round across all games.
          </p>

          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeat(s)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                  selectedSeat === s
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                S{s}
              </button>
            ))}
          </div>

          <div className="bg-surface border border-gray-700 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="round" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 8]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #4b5563', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line
                  type="stepAfter"
                  dataKey="opponent"
                  name="Opponent Seat"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ fill: '#a855f7', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'ghosts' && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Ghost/Mirror Occurrences</h3>
          {ghostData.length === 0 ? (
            <div className="bg-surface border border-gray-700 rounded-xl p-8 text-center">
              <p className="text-gray-400">No ghost/mirror data found. Ghosts appear when active player count is odd.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-surface-dark text-gray-400 border-b border-gray-700">Game</th>
                    <th className="text-left p-3 bg-surface-dark text-gray-400 border-b border-gray-700">Round</th>
                    <th className="text-left p-3 bg-surface-dark text-gray-400 border-b border-gray-700">Ghost Seat</th>
                    <th className="text-left p-3 bg-surface-dark text-gray-400 border-b border-gray-700">Real Opponent</th>
                  </tr>
                </thead>
                <tbody>
                  {ghostData.map((g, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="p-3 text-gray-300">#{games.findIndex((gm) => gm.id === g.gameId) + 1}</td>
                      <td className="p-3 text-gray-300">Round {g.round}</td>
                      <td className="p-3 text-ghost font-medium">Seat {g.ghostSeat}</td>
                      <td className="p-3 text-gray-300">Seat {g.realOpponent}</td>
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
          <h3 className="text-lg font-semibold text-white mb-4">
            Prediction Accuracy vs Standard Round-Robin
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            How closely your recorded data matches the standard Berger round-robin table.
          </p>

          <div className="bg-surface border border-gray-700 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="round" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #4b5563', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value) => [`${value}%`, 'Accuracy']}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4', r: 5 }}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
