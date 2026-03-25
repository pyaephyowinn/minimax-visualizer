import { useStore } from '../store';

export function Controls() {
  const mode = useStore((s) => s.mode);
  const speed = useStore((s) => s.speed);
  const depthLimit = useStore((s) => s.depthLimit);
  const game = useStore((s) => s.game);
  const currentStepIndex = useStore((s) => s.currentStepIndex);
  // game used for gameOver check in buttons
  const steps = useStore((s) => s.steps);

  const vizStep = useStore((s) => s.vizStep);
  const vizPlay = useStore((s) => s.vizPlay);
  const vizPause = useStore((s) => s.vizPause);
  const vizFinish = useStore((s) => s.vizFinish);
  const aiMove = useStore((s) => s.aiMove);
  const setSpeed = useStore((s) => s.setSpeed);
  const setDepthLimit = useStore((s) => s.setDepthLimit);
  const resetGame = useStore((s) => s.resetGame);

  const progress = steps.length > 0 ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0;

  return (
    <div className="controls">
      {steps.length > 0 && (
        <div className="controls-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">
            {currentStepIndex + 1} / {steps.length}
          </span>
        </div>
      )}

      <div className="controls-buttons">
        {mode === 'done' && !game.gameOver && (
          <button className="btn btn-primary" onClick={aiMove}>
            Apply AI Move
          </button>
        )}

        {(mode === 'playing' || mode === 'stepping') && (
          <>
            <button
              className="btn"
              onClick={vizStep}
              disabled={mode === 'playing'}
            >
              Step
            </button>
            {mode === 'playing' ? (
              <button className="btn" onClick={vizPause}>
                Pause
              </button>
            ) : (
              <button className="btn" onClick={vizPlay}>
                Play
              </button>
            )}
            <button className="btn" onClick={vizFinish}>
              Skip
            </button>
          </>
        )}

        <button className="btn" onClick={resetGame}>
          New Game
        </button>
      </div>

      <div className="controls-settings">
        <label className="setting">
          <span>Speed</span>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={520 - speed}
            onChange={(e) => setSpeed(520 - Number(e.target.value))}
          />
        </label>
        <label className="setting">
          <span>Depth</span>
          <select
            value={depthLimit === null ? 'full' : String(depthLimit)}
            onChange={(e) =>
              setDepthLimit(e.target.value === 'full' ? null : Number(e.target.value))
            }
          >
            <option value="3">3 - Easy</option>
            <option value="4">4 - Normal</option>
            <option value="5">5 - Hard</option>
            <option value="6">6 - Expert</option>
            <option value="full">Full - Unbeatable</option>
          </select>
        </label>
      </div>
    </div>
  );
}
