import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadGames, getGame } from '../store/gameStore';
import { getPredictionSummary } from '../algorithm/predictor';
import { getActivePlayers, getEliminatedPlayers } from '../algorithm/utils';
import { buildMatchupMatrix } from '../algorithm/patternDiscovery';

export default function Predict() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('id');

  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(preselectedId || '');
  const [roundNumber, setRoundNumber] = useState(1);
  const [predictions, setPredictions] = useState(null);
  const [showMethod, setShowMethod] = useState('hybrid');

  useEffect(() => {
    const allGames = loadGames();
    setGames(allGames);
    if (!preselectedId && allGames.length > 0 && !selectedGameId) {
      setSelectedGameId(allGames[0].id);
    }
  }, [preselectedId, selectedGameId]);

  const selectedGame = useMemo(() => {
    if (!selectedGameId) return null;
    return allGames.find((g) => g.id === selectedGameId) || null;
  }, [selectedGameId, allGames]);

  // Sync games list
  useEffect(() => {
    setGames(loadGames());
  }, []);

  const allGames = useMemo(() => {
    const loaded = loadGames();
    return loaded;
  }, []);

  const activePlayers = useMemo(() => {
    if (!selectedGame) return [];
    return getActivePlayers(selectedGame.players, roundNumber - 1);
  }, [selectedGame, roundNumber]);

  const eliminatedPlayers = useMemo(() => {
    if (!selectedGame) return [];
    return getEliminatedPlayers(selectedGame.players, roundNumber - 1);
  }, [selectedGame, roundNumber]);

  const maxRound = useMemo(() => {
    if (!selectedGame) return 1;
    const maxR = selectedGame.rounds?.length || 0;
    return maxR > 0 ? maxR : 1;
  }, [selectedGame]);

  const allGameData = useMemo(() => allGames, [allGames]);

  const handlePredict = () => {
    if (!selectedGame) return;

    const activeSeats = activePlayers.map((p) => p.seat);
    const eliminatedSeats = [1, 2, 3, 4, 5, 6, 7, 8].filter(
      (s) => !activeSeats.includes(s)
    );

    const allGamesExcept = allGameData.filter((g) => g.id !== selectedGame.id);
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
        playerName: player?.name || `Player ${p.seat}`,
        actualOpponent,
        opponentName: actualOpponent
          ? selectedGame.players.find((pl) => pl.seat === actualOpponent)?.name || `Player ${actualOpponent}`
          : null,
        wasCorrect,
        predictedName: p.predictedOpponent
          ? selectedGame.players.find((pl) => pl.seat === p.predictedOpponent)?.name || `Player ${p.predictedOpponent}`
          : 'Unknown',
      };
    });

    setPredictions(enriched);
  };

  const accuracy = useMemo(() => {
    if (!predictions) return null;
    const evaluable = predictions.filter((p) => p.wasCorrect !== null);
    if (evaluable.length === 0) return null;
    const correct = evaluable.filter((p) => p.wasCorrect).length;
    return Math.round((correct / evaluable.length) * 100);
  }, [predictions]);

  if (allGames.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-5xl mb-4">🔮</p>
        <h1 className="text-2xl font-bold text-white mb-2">No Game Data</h1>
        <p className="text-gray-400 mb-4">Record at least one game to start predicting opponents.</p>
        <a
          href="/input"
          className="inline-block px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
        >
          Record Game First
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Predict Next Opponent</h1>

      <div className="bg-surface border border-gray-700 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Select Game</label>
            <select
              value={selectedGameId}
              onChange={(e) => {
                setSelectedGameId(e.target.value);
                setPredictions(null);
              }}
              className="w-full bg-surface-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
            >
              {allGameData.map((g, idx) => (
                <option key={g.id} value={g.id}>
                  Game #{idx + 1} ({new Date(g.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Round Number</label>
            <input
              type="number"
              min={1}
              max={Math.max(maxRound + 1, 30)}
              value={roundNumber}
              onChange={(e) => {
                setRoundNumber(parseInt(e.target.value) || 1);
                setPredictions(null);
              }}
              className="w-full bg-surface-dark border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePredict}
              className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors text-sm"
            >
              Predict Round {roundNumber}
            </button>
          </div>
        </div>

        {selectedGame && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-400">
              Active: {activePlayers.length} players
            </span>
            <span className="text-gray-400">
              Eliminated: {eliminatedPlayers.length} players
            </span>
            <span className="text-gray-400">
              Ghost needed: {activePlayers.length % 2 !== 0 ? 'Yes' : 'No'}
            </span>
          </div>
        )}
      </div>

      {predictions && (
        <>
          {accuracy !== null && (
            <div className={`mb-6 rounded-xl p-4 border ${accuracy >= 70 ? 'bg-green-900/20 border-green-800' : accuracy >= 40 ? 'bg-yellow-900/20 border-yellow-800' : 'bg-red-900/20 border-red-800'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{accuracy}%</span>
                <span className="text-sm text-gray-300">Prediction Accuracy (evaluated on recorded rounds)</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {predictions.map((pred) => (
              <div
                key={pred.seat}
                className={`bg-surface border rounded-xl p-5 transition-colors ${
                  pred.wasCorrect === true
                    ? 'border-green-700 bg-green-900/10'
                    : pred.wasCorrect === false
                    ? 'border-red-700 bg-red-900/10'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-light text-sm font-bold text-white">
                      {pred.seat}
                    </span>
                    <div>
                      <span className="text-white font-medium">{pred.playerName}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        Seat {pred.seat}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {pred.wasCorrect === true && (
                      <span className="text-green-400 text-xs font-medium bg-green-900/30 px-2 py-0.5 rounded">
                        Correct
                      </span>
                    )}
                    {pred.wasCorrect === false && (
                      <span className="text-red-400 text-xs font-medium bg-red-900/30 px-2 py-0.5 rounded">
                        Incorrect
                      </span>
                    )}

                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        pred.method === 'historical' || pred.method === 'data'
                          ? 'bg-primary/20 text-primary'
                          : pred.method === 'standard'
                          ? 'bg-accent/20 text-accent'
                          : pred.method === 'ghost'
                          ? 'bg-ghost/20 text-ghost'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {pred.method}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface-dark rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Predicted Opponent</p>
                    <p className="text-white font-medium">
                      {pred.predictedName || 'Unknown'}
                      {pred.confidence > 0 && (
                        <span className="text-xs text-gray-400 ml-2">
                          ({Math.round(pred.confidence)}% confidence)
                        </span>
                      )}
                    </p>
                  </div>
                  {pred.actualOpponent !== undefined && pred.actualOpponent !== null && (
                    <div className="bg-surface-dark rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Actual Opponent</p>
                      <p className={`font-medium ${pred.wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {pred.opponentName || `Player ${pred.actualOpponent}`}
                      </p>
                    </div>
                  )}
                  {pred.actualOpponent === undefined || pred.actualOpponent === null ? (
                    <div className="bg-surface-dark rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Actual Opponent</p>
                      <p className="text-gray-500">Not yet recorded</p>
                    </div>
                  ) : null}
                </div>

                {pred.note && (
                  <p className="mt-2 text-xs text-gray-500 italic">{pred.note}</p>
                )}
                {pred.totalGames !== undefined && (
                  <p className="mt-1 text-xs text-gray-600">
                    Based on {pred.matchCount} match{ pred.matchCount !== 1 ? 'es' : ''} out of {pred.totalGames} games
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!predictions && selectedGame && (
        <div className="bg-surface border border-gray-700 rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">🔮</p>
          <p className="text-gray-400">
            Select round and click &quot;Predict&quot; to see opponent predictions
          </p>
        </div>
      )}
    </div>
  );
}
