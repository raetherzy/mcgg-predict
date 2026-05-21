export default function SeatGrid({ players, selectedSeat, onSelect, disabled = false }) {
  const positions = [
    { top: '5%', left: '50%' },
    { top: '18%', left: '80%' },
    { top: '43%', left: '92%' },
    { top: '68%', left: '80%' },
    { top: '82%', left: '50%' },
    { top: '68%', left: '20%' },
    { top: '43%', left: '8%' },
    { top: '18%', left: '20%' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 300, aspectRatio: '1', margin: '0 auto' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '3px solid #444',
      }} />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((seat) => {
        const player = players.find((p) => p.seat === seat);
        const pos = positions[seat - 1];
        const isSelected = selectedSeat === seat;
        const isEliminated = player?.eliminatedAtRound !== null && player?.eliminatedAtRound !== undefined;

        return (
          <button
            key={seat}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(seat)}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: 'translate(-50%, -50%)',
              width: 36,
              height: 36,
              border: isSelected ? '3px solid var(--color-neon-green)' : '3px solid #555',
              background: isSelected ? 'rgba(0,255,65,0.2)' : '#111',
              color: isEliminated ? '#ff3333' : '#ddd',
              fontSize: '0.7rem',
              fontWeight: 800,
              fontFamily: '"JetBrains Mono", monospace',
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: isEliminated ? 'line-through' : 'none',
              opacity: isEliminated ? 0.5 : 1,
              transition: 'background 0.1s',
            }}
            title={player?.name || `Seat ${seat}`}
          >
            {player?.name?.charAt(0).toUpperCase() || seat}
          </button>
        );
      })}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#555', fontSize: '0.65rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        BOARD
      </div>
    </div>
  );
}
