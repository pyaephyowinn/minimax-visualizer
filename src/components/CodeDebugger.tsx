import { useEffect, useRef, useState, useCallback, type PointerEvent } from 'react';
import { useStore } from '../store';
import { CODE_LINES, getHighlightedLineId } from '../codeLines';

const STEP_LABELS: Record<string, string> = {
  visit: 'Visit',
  score: 'Score',
  backpropagate: 'Backpropagate',
  prune: 'Prune',
};

function formatNum(n: number): string {
  if (n === Infinity) return '+∞';
  if (n === -Infinity) return '-∞';
  return String(n);
}

export function CodeDebugger({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const mode = useStore((s) => s.mode);
  const steps = useStore((s) => s.steps);
  const currentStepIndex = useStore((s) => s.currentStepIndex);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ x: 12, y: 12 });
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length
    ? steps[currentStepIndex]
    : null;

  const highlightedLineId = currentStep ? getHighlightedLineId(currentStep) : null;

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedLineId, currentStepIndex]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    // Only drag from the header
    if (!(e.target as HTMLElement).closest('.debugger-drag-handle')) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }, [pos]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  if (!visible) return null;

  const isIdle = mode === 'idle';

  return (
    <div
      ref={panelRef}
      className="debugger-float"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="debugger-header debugger-drag-handle">
        <span className="debugger-title">explore()</span>
        <span className="debugger-badge">Debugger</span>
        <button className="debugger-close" onClick={onToggle} aria-label="Close debugger">
          ✕
        </button>
      </div>
      {isIdle ? (
        <div className="debugger-body-empty">
          <span className="debugger-placeholder">Activates during visualization</span>
        </div>
      ) : (
        <>
          <div className="debugger-code">
            {CODE_LINES.map((line, i) => {
              const isActive = highlightedLineId === line.id;
              const isBlank = line.text === '';
              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : undefined}
                  className={
                    'debugger-line' +
                    (isActive ? ' debugger-line-active' : '') +
                    (isBlank ? ' debugger-line-blank' : '')
                  }
                >
                  <span className="debugger-lineno">{isBlank ? '' : i + 1}</span>
                  <span className="debugger-marker">{isActive ? '▶' : ' '}</span>
                  <span
                    className={
                      'debugger-text' +
                      (line.kind === 'keyword' ? ' debugger-keyword' : '') +
                      (line.kind === 'comment' ? ' debugger-comment' : '')
                    }
                    style={{ paddingLeft: line.indent * 16 }}
                  >
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
          {currentStep && (
            <div className="debugger-context">
              <span className={'debugger-step-type debugger-step-' + currentStep.type}>
                {STEP_LABELS[currentStep.type]}
              </span>
              <span className="debugger-detail">depth: {currentStep.depth}</span>
              <span className="debugger-detail">{currentStep.isMaximizing ? 'MAX' : 'MIN'}</span>
              <span className="debugger-detail">α: {formatNum(currentStep.alpha)}</span>
              <span className="debugger-detail">β: {formatNum(currentStep.beta)}</span>
              {currentStep.score !== null && (
                <span className="debugger-detail debugger-score">
                  score: {currentStep.score}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
