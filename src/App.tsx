import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { Board } from './components/Board';
import { TreeVisualizer } from './components/TreeVisualizer';
import { CodeDebugger } from './components/CodeDebugger';
import { Controls } from './components/Controls';
import './App.css';

function App() {
  const mode = useStore((s) => s.mode);
  const speed = useStore((s) => s.speed);
  const vizStep = useStore((s) => s.vizStep);
  const timerRef = useRef<number | null>(null);
  const [debuggerVisible, setDebuggerVisible] = useState(true);

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
      <Header />
      <main className="app-main">
        <div className="left-panel">
          <StatusBar />
          <Board />
          <Controls />
          <div className="minimax-info">
            <p>
              <strong>Minimax</strong> is a decision-making algorithm that finds
              the optimal move by simulating all possible game states, assuming
              both players play perfectly.{' '}
              <a
                href="https://en.wikipedia.org/wiki/Minimax"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
        <div className="right-panel">
          <TreeVisualizer />
          {!debuggerVisible && (
            <button
              className="debugger-toggle-btn"
              onClick={() => setDebuggerVisible(true)}
            >
              {'</>'} Debugger
            </button>
          )}
          <CodeDebugger
            visible={debuggerVisible}
            onToggle={() => setDebuggerVisible(false)}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
