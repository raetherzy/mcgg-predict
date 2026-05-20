import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGames, deleteGame, exportAllGames, importGames, replaceAllGames } from '../store/gameStore';

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importMsg, setImportMsg] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setGames(loadGames());
  }, []);

  const handleDelete = (id) => {
    if (deleteConfirm === id) {
      deleteGame(id);
      setGames(loadGames());
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const handleExport = () => {
    if (games.length === 0) return;
    exportAllGames();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const mode = window.confirm('Merge with existing data? (OK = merge, Cancel = replace all)');
        if (mode) {
          importGames(evt.target.result);
        } else {
          replaceAllGames(evt.target.result);
        }
        setGames(loadGames());
        setImportMsg({ type: 'success', text: 'Data imported successfully!' });
      } catch (err) {
        setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
      }
      e.target.value = '';
      setTimeout(() => setImportMsg(null), 3000);
    };
    reader.readAsText(file);
  };

  const totalRounds = games.reduce((sum, g) => sum + (g.rounds?.length || 0), 0);
  const totalEliminations = games.reduce(
    (sum, g) =>
      sum + g.players.filter((p) => p.eliminatedAtRound !== null && p.eliminatedAtRound !== undefined).length,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your recorded Magic Chess games</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={games.length === 0}
            className="px-3 py-2 bg-surface border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⬇ Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 bg-surface border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-sm transition-colors"
          >
            ⬆ Import
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={() => navigate('/input')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors text-sm"
          >
            + Record New Game
          </button>
        </div>
      </div>

      {importMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
          importMsg.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
        }`}>
          {importMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total Games</p>
          <p className="text-3xl font-bold text-white mt-1">{games.length}</p>
        </div>
        <div className="bg-surface border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Total Rounds</p>
          <p className="text-3xl font-bold text-white mt-1">{totalRounds}</p>
        </div>
        <div className="bg-surface border border-gray-700 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Eliminations</p>
          <p className="text-3xl font-bold text-white mt-1">{totalEliminations}</p>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="bg-surface border border-gray-700 rounded-xl p-12 text-center">
          <p className="text-5xl mb-4">🎮</p>
          <h2 className="text-xl font-semibold text-white mb-2">No games recorded yet</h2>
          <p className="text-gray-400 mb-4">Start recording your first Magic Chess game to begin analysis.</p>
          <button
            onClick={() => navigate('/input')}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
          >
            Record First Game
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {games
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((game) => (
              <div
                key={game.id}
                className="bg-surface border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">
                        Game #{games.indexOf(game) + 1}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(game.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>{game.players.length} players</span>
                      <span>{game.rounds?.length || 0} rounds recorded</span>
                      <span>
                        {game.players.filter((p) => p.eliminatedAtRound !== null && p.eliminatedAtRound !== undefined).length} eliminated
                      </span>
                      <span>
                        Active: {game.players.filter((p) => p.eliminatedAtRound === null || p.eliminatedAtRound === undefined).length}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {game.players.map((p) => (
                        <span
                          key={p.seat}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            p.eliminatedAtRound !== null && p.eliminatedAtRound !== undefined
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-green-900/30 text-green-400'
                          }`}
                        >
                          S{p.seat}: {p.name}
                          {p.eliminatedAtRound !== null && p.eliminatedAtRound !== undefined && (
                            <span className="ml-1 opacity-75">(R{p.eliminatedAtRound})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/predict?id=${game.id}`)}
                      className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
                    >
                      Predict
                    </button>
                    <button
                      onClick={() => handleDelete(game.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        deleteConfirm === game.id
                          ? 'bg-red-600 text-white'
                          : 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                      }`}
                    >
                      {deleteConfirm === game.id ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
