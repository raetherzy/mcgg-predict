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
        const mode = window.confirm('MERGE with existing data? [OK] = Merge  [Cancel] = Replace all');
        if (mode) {
          importGames(evt.target.result);
        } else {
          replaceAllGames(evt.target.result);
        }
        setGames(loadGames());
        setImportMsg({ type: 'success', text: 'DATA IMPORTED' });
      } catch (err) {
        setImportMsg({ type: 'error', text: `IMPORT FAILED: ${err.message}` });
      }
      e.target.value = '';
      setTimeout(() => setImportMsg(null), 3000);
    };
    reader.readAsText(file);
  };

  const totalRounds = games.reduce((sum, g) => sum + (g.rounds?.length || 0), 0);
  const totalEliminations = games.reduce(
    (sum, g) => sum + g.players.filter((p) => p.eliminatedAtRound).length, 0
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: 0, color: '#fff' }}>
            DASHBOARD
          </h1>
          <p style={{ color: '#666', marginTop: 4, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            RECORDED GAMES OVERVIEW
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExport} disabled={games.length === 0} className="brutal-btn brutal-btn-sm" style={{ boxShadow: '3px 3px 0 #fff' }}>
            ⬇ EXPORT
          </button>
          <button onClick={() => fileRef.current?.click()} className="brutal-btn brutal-btn-sm" style={{ boxShadow: '3px 3px 0 #fff' }}>
            ⬆ IMPORT
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <button onClick={() => navigate('/input')} className="brutal-btn brutal-btn-neon brutal-btn-sm" style={{ boxShadow: '3px 3px 0 var(--color-neon-green)' }}>
            + NEW GAME
          </button>
        </div>
      </div>

      {importMsg && (
        <div style={{
          marginBottom: 20, padding: '10px 16px', border: '3px solid',
          borderColor: importMsg.type === 'success' ? 'var(--color-neon-green)' : '#ff3333',
          color: importMsg.type === 'success' ? 'var(--color-neon-green)' : '#ff3333',
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
        }}>
          {importMsg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="brutal-stat">
          <div className="brutal-stat-label">GAMES</div>
          <div className="brutal-stat-value">{games.length}</div>
        </div>
        <div className="brutal-stat">
          <div className="brutal-stat-label">ROUNDS</div>
          <div className="brutal-stat-value">{totalRounds}</div>
        </div>
        <div className="brutal-stat">
          <div className="brutal-stat-label">ELIMINATED</div>
          <div className="brutal-stat-value" style={{ color: '#ff3333' }}>{totalEliminations}</div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="brutal-card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>♟</div>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
            NO GAMES YET
          </h2>
          <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: 20 }}>
            RECORD YOUR FIRST MAGIC CHESS GAME
          </p>
          <button onClick={() => navigate('/input')} className="brutal-btn brutal-btn-neon">
            RECORD GAME
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {games
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((game, idx) => {
              const activeCount = game.players.filter((p) => !p.eliminatedAtRound).length;
              const elimCount = game.players.filter((p) => p.eliminatedAtRound).length;
              return (
                <div key={game.id} className="brutal-card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                          GAME #{games.length - idx}
                        </span>
                        <span style={{ color: '#555', fontSize: '0.6rem' }}>
                          {new Date(game.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.68rem', color: '#888', marginBottom: 10 }}>
                        <span>{game.rounds?.length || 0} ROUNDS</span>
                        <span style={{ color: 'var(--color-neon-green)' }}>{activeCount} ACTIVE</span>
                        <span style={{ color: '#ff3333' }}>{elimCount} ELIMINATED</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {game.players.map((p) => (
                          <span key={p.seat} style={{
                            display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
                            border: `2px solid ${p.eliminatedAtRound ? '#ff3333' : 'var(--color-neon-green)'}`,
                            color: p.eliminatedAtRound ? '#ff3333' : 'var(--color-neon-green)',
                            fontSize: '0.62rem', fontWeight: 700,
                          }}>
                            S{p.seat} {p.name}
                            {p.eliminatedAtRound && (
                              <span style={{ marginLeft: 4, opacity: 0.7 }}>R{p.eliminatedAtRound}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => navigate(`/predict?id=${game.id}`)}
                        className="brutal-btn brutal-btn-sm"
                        style={{ boxShadow: '3px 3px 0 var(--color-neon-green)', borderColor: 'var(--color-neon-green)', color: 'var(--color-neon-green)' }}
                      >
                        PREDICT
                      </button>
                      <button
                        onClick={() => handleDelete(game.id)}
                        className="brutal-btn brutal-btn-sm"
                        style={{
                          boxShadow: '3px 3px 0 #ff3333',
                          borderColor: '#ff3333',
                          color: '#ff3333',
                          background: deleteConfirm === game.id ? '#ff3333' : 'transparent',
                          ...(deleteConfirm === game.id ? { color: '#0d0d0d' } : {}),
                        }}
                      >
                        {deleteConfirm === game.id ? 'CONFIRM?' : 'DELETE'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
