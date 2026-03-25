import { useStore } from '../store';

export function StatusBar() {
  const game = useStore((s) => s.game);
  const mode = useStore((s) => s.mode);

  let text = '';
  let variant = 'default';

  if (game.gameOver) {
    if (game.winner === 'draw') {
      text = "It's a draw!";
      variant = 'draw';
    } else if (game.winner === 'X') {
      text = 'You win!';
      variant = 'win';
    } else {
      text = 'AI wins!';
      variant = 'lose';
    }
  } else if (mode === 'idle' && game.currentPlayer === 'X') {
    text = 'Your turn';
    variant = 'your-turn';
  } else if (mode === 'playing' || mode === 'stepping') {
    text = 'AI is thinking...';
    variant = 'thinking';
  } else if (mode === 'done') {
    text = 'AI ready to move';
    variant = 'ready';
  }

  return (
    <div className={`status-bar status-${variant}`}>
      {text}
    </div>
  );
}
