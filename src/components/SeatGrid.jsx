export default function SeatGrid({ players, selectedSeat, onSelect, disabled = false }) {
  const positions = [
    { seat: 1, top: '0%', left: '50%' },
    { seat: 2, top: '12%', left: '78%' },
    { seat: 3, top: '38%', left: '90%' },
    { seat: 4, top: '65%', left: '78%' },
    { seat: 5, top: '78%', left: '50%' },
    { seat: 6, top: '65%', left: '22%' },
    { seat: 7, top: '38%', left: '10%' },
    { seat: 8, top: '12%', left: '22%' },
  ];

  return (
    <div className="relative w-full max-w-[320px] aspect-square mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-gray-700 bg-surface/50" />
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
            className={`absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${isSelected ? 'ring-2 ring-primary bg-primary/30 text-white scale-110' : ''}
              ${isEliminated ? 'bg-red-900/50 text-red-400 line-through opacity-60' : 'bg-surface-light text-gray-300 hover:bg-primary/20 hover:text-white'}
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
            style={{ top: pos.top, left: pos.left }}
            title={player ? `Seat ${seat}: ${player.name}` : `Seat ${seat}: Empty`}
          >
            {player ? player.name.charAt(0).toUpperCase() : seat}
          </button>
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-medium">
        Board
      </div>
    </div>
  );
}
