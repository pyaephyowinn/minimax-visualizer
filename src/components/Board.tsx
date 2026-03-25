import { useStore } from '../store';
import { getWinningCells } from '../minimax';

export function Board() {
  const game = useStore((s) => s.game);
  const lastMove = useStore((s) => s.lastMove);
  const mode = useStore((s) => s.mode);
  const humanMove = useStore((s) => s.humanMove);
  const aiThink = useStore((s) => s.aiThink);
  const aiMoveInstant = useStore((s) => s.aiMoveInstant);

  const disabled = game.gameOver || game.currentPlayer !== 'X' || mode !== 'idle';
  const winningCells = game.winner && game.winner !== 'draw' ? getWinningCells(game.board) : [];

  const handleClick = (index: number) => {
    if (disabled || game.board[index] !== null) return;
    humanMove(index);
    setTimeout(() => {
      const state = useStore.getState();
      if (!state.game.gameOver && state.game.currentPlayer === 'O') {
        // Skip visualization for the first AI move (8 empty cells) - tree is too large
        const emptyCells = state.game.board.filter((c) => c === null).length;
        if (emptyCells >= 8) {
          aiMoveInstant();
        } else {
          aiThink();
        }
      }
    }, 300);
  };

  return (
    <div className="board-container">
      <div className="board">
        {game.board.map((cell, i) => {
          const isWinning = winningCells.includes(i);
          const isLast = lastMove === i;
          return (
            <button
              key={i}
              className={
                'cell' +
                (cell ? ` cell-${cell}` : '') +
                (isWinning ? ' cell-winning' : '') +
                (isLast ? ' cell-last' : '') +
                (disabled || cell ? ' cell-disabled' : '')
              }
              onClick={() => handleClick(i)}
              disabled={disabled || cell !== null}
            >
              {cell && <span className="cell-mark">{cell}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
