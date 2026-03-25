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
  const pad = cellSize * 0.2;

  return (
    <svg width={BOARD_SIZE} height={BOARD_SIZE} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid lines */}
      <line x1={cellSize} y1={0} x2={cellSize} y2={BOARD_SIZE} stroke="#888" strokeWidth={0.8} />
      <line x1={cellSize * 2} y1={0} x2={cellSize * 2} y2={BOARD_SIZE} stroke="#888" strokeWidth={0.8} />
      <line x1={0} y1={cellSize} x2={BOARD_SIZE} y2={cellSize} stroke="#888" strokeWidth={0.8} />
      <line x1={0} y1={cellSize * 2} x2={BOARD_SIZE} y2={cellSize * 2} stroke="#888" strokeWidth={0.8} />
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
              <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
              <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
            </g>
          );
        }
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#dc2626" strokeWidth={2} />;
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

  // Light theme: white nodes with colored borders
  let bgColor = '#ffffff';
  let borderColor = '#bbb8b0';
  let borderWidth = 1.5;

  if (scored) {
    bgColor = isMaximizing ? '#eef4ff' : '#fef2f2';
    borderColor = isMaximizing ? '#2563eb' : '#dc2626';
    borderWidth = 2;
  }
  if (pruned && scored) {
    bgColor = '#f5f5f4';
    borderColor = '#a8a29e';
  }
  if (isBestPath) {
    bgColor = '#fffbeb';
    borderColor = '#d97706';
    borderWidth = 3;
  }
  if (isCurrent) {
    borderColor = '#7c3aed';
    borderWidth = 3;
  }

  const scoreColor = score > 0 ? '#16a34a' : score < 0 ? '#dc2626' : '#555550';

  return (
    <g>
      {/* Drop shadow */}
      <rect
        x={-NODE_W / 2 + 2}
        y={-NODE_H / 2 + 2}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill="rgba(0,0,0,0.06)"
      />
      {/* Node background */}
      <rect
        x={-NODE_W / 2}
        y={-NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
      {/* MAX/MIN label via foreignObject for proper font rendering */}
      <foreignObject
        x={-NODE_W / 2}
        y={-NODE_H / 2 + 2}
        width={NODE_W}
        height={18}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 300,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.5px',
            color: isMaximizing ? '#2563eb' : '#dc2626',
            textAlign: 'center',
            lineHeight: '16px',
          }}
        >
          {isMaximizing ? 'MAX' : 'MIN'}
        </div>
      </foreignObject>
      {/* Mini board via foreignObject */}
      <foreignObject
        x={-BOARD_SIZE / 2}
        y={-NODE_H / 2 + 18}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
      >
        <MiniBoardSvg board={board} />
      </foreignObject>
      {/* Score via foreignObject for proper font rendering */}
      {scored && score !== -999 && (
        <foreignObject
          x={-NODE_W / 2}
          y={NODE_H / 2 - 22}
          width={NODE_W}
          height={22}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 300,
              fontFamily: "'DM Mono', monospace",
              color: scoreColor,
              textAlign: 'center',
              lineHeight: '20px',
            }}
          >
            {score}
          </div>
        </foreignObject>
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
      setTranslate({ x: width / 2, y: 70 });
    }
  }, []);

  useEffect(() => {
    centerTree();
  }, [tree, centerTree]);

  if (!tree) {
    return (
      <div className="tree-container tree-empty" ref={containerRef}>
        <div className="tree-placeholder">
          <p>Make 2 moves to see the MiniMax tree</p>
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
          <span className="legend-dot" style={{ background: '#2563eb' }} /> MAX
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#dc2626' }} /> MIN
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#d97706' }} /> Best
        </span>
      </div>
    </div>
  );
}
