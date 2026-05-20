const STORAGE_KEY = 'mcgg-predict-games';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function addGame(gameData) {
  const games = loadGames();
  const game = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...gameData,
  };
  games.push(game);
  saveGames(games);
  return game;
}

export function getGame(id) {
  return loadGames().find((g) => g.id === id) || null;
}

export function deleteGame(id) {
  const games = loadGames().filter((g) => g.id !== id);
  saveGames(games);
}

export function updateGame(id, updates) {
  const games = loadGames();
  const idx = games.findIndex((g) => g.id === id);
  if (idx !== -1) {
    games[idx] = { ...games[idx], ...updates };
    saveGames(games);
    return games[idx];
  }
  return null;
}

export function clearAllGames() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportAllGames() {
  const games = loadGames();
  const data = JSON.stringify(games, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcgg-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importGames(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) throw new Error('Invalid format: expected array');
  const games = loadGames();
  for (const item of parsed) {
    if (item.id && games.find((g) => g.id === item.id)) continue;
    games.push(item);
  }
  saveGames(games);
  return games;
}

export function replaceAllGames(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) throw new Error('Invalid format: expected array');
  saveGames(parsed);
  return parsed;
}
