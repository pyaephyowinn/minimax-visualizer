import { useRef, useCallback, useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import type { RawNodeDatum, CustomNodeElementProps } from 'react-d3-tree';
import type { TreeNode, CellValue } from '../types';
import { useStore } from '../store';

function treeNodeToRawDatum(
  node: TreeNode,
  visitedIds: Set<number>,
  scoredIds: Set<number>,
  bestPathIds: Set<number>,
  currentNodeId: number | null,
): RawNodeDatum | null {
  if (!visitedIds.has(node.id)) return null;

  const children: RawNodeDatum[] = [];
  for (const child of node.children) {
    const childDatum = treeNodeToRawDatum(child, visitedIds, scoredIds, bestPathIds, currentNodeId);
    if (childDatum) children.push(childDatum);
  }

  return {
    name: String(node.id),
    attributes: {
      board: node.board.map((c) => (c === null ? '_' : c)).join(''),
      score: node.score !== null ? node.score : -999,
      isMaximizing: node.isMaximizing ? 1 : 0,
      scored: scoredIds.has(node.id) ? 1 : 0,
      isBestPath: bestPathIds.has(node.id) ? 1 : 0,
      isCurrent: node.id === currentNodeId ? 1 : 0,
      pruned: node.pruned ? 1 : 0,
    },
    children: children.length > 0 ? children : undefined,
  };
}

function parseBoardFromAttr(boardStr: string | number | boolean): CellValue[] {
  return String(boardStr)
    .split('')
    .map((c) => (c === 'X' ? 'X' : c === 'O' ? 'O' : null));
}

const NODE_W = 100;
const NODE_H = 100;
const BOARD_SIZE = 54;

function MiniBoardSvg({ board }: { board: CellValue[] }) {
  const cellSize = BOARD_SIZE / 3;
  const pad = cellSize * 0.15;

  return (
    <svg width={BOARD_SIZE} height={BOARD_SIZE} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid lines */}
      <line x1={cellSize} y1={0} x2={cellSize} y2={BOARD_SIZE} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
      <line x1={cellSize * 2} y1={0} x2={cellSize * 2} y2={BOARD_SIZE} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
      <line x1={0} y1={cellSize} x2={BOARD_SIZE} y2={cellSize} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
      <line x1={0} y1={cellSize * 2} x2={BOARD_SIZE} y2={cellSize * 2} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
      {board.map((cell, i) => {
        if (!cell) return null;
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;
        const r = cellSize / 2 - pad;
        if (cell === 'X') {
          return (
            <g key={i}>
              <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="#60a5fa" strokeWidth={1.5} strokeLinecap="round" />
              <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="#60a5fa" strokeWidth={1.5} strokeLinecap="round" />
            </g>
          );
        }
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth={1.5} />;
      })}
    </svg>
  );
}

function CustomNode({ nodeDatum }: CustomNodeElementProps) {
  const attrs = nodeDatum.attributes || {};
  const board = parseBoardFromAttr(attrs.board || '_________');
  const score = Number(attrs.score);
  const isMaximizing = attrs.isMaximizing === 1;
  const scored = attrs.scored === 1;
  const isBestPath = attrs.isBestPath === 1;
  const isCurrent = attrs.isCurrent === 1;
  const pruned = attrs.pruned === 1;

  let bgColor = 'rgba(255,255,255,0.03)';
  let borderColor = '#363752';
  let borderWidth = 1.5;

  if (scored) {
    bgColor = isMaximizing ? 'rgba(96,165,250,0.12)' : 'rgba(248,113,113,0.12)';
    borderColor = isMaximizing ? '#60a5fa' : '#f87171';
  }
  if (pruned && scored) {
    bgColor = 'rgba(100,116,139,0.08)';
    borderColor = '#475569';
  }
  if (isBestPath) {
    borderColor = '#fbbf24';
    borderWidth = 2.5;
  }
  if (isCurrent) {
    borderWidth = 3;
  }

  const scoreColor = score > 0 ? '#34d399' : score < 0 ? '#f87171' : '#94a3b8';

  return (
    <g>
      <rect
        x={-NODE_W / 2}
        y={-NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
        filter={isCurrent ? 'drop-shadow(0 0 6px rgba(167,139,250,0.5))' : undefined}
      />
      {/* MAX/MIN label */}
      <text
        y={-NODE_H / 2 - 6}
        textAnchor="middle"
        fill={isMaximizing ? '#60a5fa' : '#f87171'}
        fontSize={12}
        fontFamily="var(--font-mono)"
        fontWeight={600}
        opacity={0.85}
      >
        {isMaximizing ? 'MAX' : 'MIN'}
      </text>
      {/* Mini board via foreignObject */}
      <foreignObject
        x={-BOARD_SIZE / 2}
        y={-BOARD_SIZE / 2 - 6}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
      >
        <MiniBoardSvg board={board} />
      </foreignObject>
      {/* Score */}
      {scored && score !== -999 && (
        <text
          y={NODE_H / 2 - 8}
          textAnchor="middle"
          fill={scoreColor}
          fontSize={16}
          fontFamily="var(--font-mono)"
          fontWeight={700}
        >
          {score}
        </text>
      )}
    </g>
  );
}

export function TreeVisualizer() {
  const tree = useStore((s) => s.tree);
  const visitedNodeIds = useStore((s) => s.visitedNodeIds);
  const scoredNodeIds = useStore((s) => s.scoredNodeIds);
  const bestPathNodeIds = useStore((s) => s.bestPathNodeIds);
  const steps = useStore((s) => s.steps);
  const currentStepIndex = useStore((s) => s.currentStepIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const centerTree = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 60 });
    }
  }, []);

  useEffect(() => {
    centerTree();
  }, [tree, centerTree]);

  if (!tree) {
    return (
      <div className="tree-container tree-empty" ref={containerRef}>
        <div className="tree-placeholder">
          <p>Make a move to see the MiniMax tree</p>
        </div>
      </div>
    );
  }

  const currentStep =
    currentStepIndex >= 0 && currentStepIndex < steps.length ? steps[currentStepIndex] : null;
  const currentNodeId = currentStep ? currentStep.nodeId : null;

  const data = treeNodeToRawDatum(tree, visitedNodeIds, scoredNodeIds, bestPathNodeIds, currentNodeId);

  if (!data) {
    return (
      <div className="tree-container tree-empty" ref={containerRef}>
        <div className="tree-placeholder">
          <p>Visualizing {steps.length} steps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-container" ref={containerRef}>
      <Tree
        data={data}
        orientation="vertical"
        translate={translate}
        nodeSize={{ x: 120, y: 140 }}
        separation={{ siblings: 1, nonSiblings: 1.2 }}
        pathFunc="straight"
        collapsible={false}
        zoomable={true}
        draggable={true}
        scaleExtent={{ min: 0.02, max: 2 }}
        renderCustomNodeElement={(props) => <CustomNode {...props} />}
        pathClassFunc={() => 'tree-link'}
      />
      <div className="tree-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#60a5fa' }} /> MAX
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#f87171' }} /> MIN
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#fbbf24' }} /> Best
        </span>
      </div>
    </div>
  );
}
