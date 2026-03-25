import { useEffect, useRef } from 'react';
import { useStore } from './store';
import { Board } from './components/Board';
import { TreeVisualizer } from './components/TreeVisualizer';
import { Controls } from './components/Controls';
import './App.css';

function App() {
  const mode = useStore((s) => s.mode);
  const speed = useStore((s) => s.speed);
  const vizStep = useStore((s) => s.vizStep);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'playing') {
      timerRef.current = window.setInterval(() => {
        vizStep();
      }, speed);
      return () => {
        if (timerRef.current !== null) clearInterval(timerRef.current);
      };
    }
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [mode, speed, vizStep]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>MiniMax Visualizer</h1>
        <p className="app-subtitle">TicTacToe with Alpha-Beta Pruning</p>
      </header>
      <main className="app-main">
        <div className="left-panel">
          <Board />
          <Controls />
        </div>
        <div className="right-panel">
          <TreeVisualizer />
        </div>
      </main>
    </div>
  );
}

export default App;
