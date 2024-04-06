import { useCallback } from 'react';
import { EdgeProps, useStore, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

import { getEdgeParams } from './utils.js';


// this is a little helper component to render the actual edge label
function EdgeLabel({ transform, label }: { transform: string; label: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        background: 'transparent',
        padding: 10,
        color: '#ff5050',
        fontSize: 12,
        fontWeight: 700,
        transform,
      }}
      className="nodrag nopan"
    >
      {label}
    </div>
  );
}

function FloatingEdge({ id, source, target, markerEnd, style }) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <>
    <EdgeLabelRenderer>
        {source && (
          <EdgeLabel
            transform={`translate(-50%, 0%) translate(${sx}px,${sy}px)`}
            label={source}
          />
        )}
        {target && (
          <EdgeLabel
            transform={`translate(-50%, -100%) translate(${tx}px,${ty}px)`}
            label={target}
          />
        )}
      </EdgeLabelRenderer>
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
    </>
  );
}

export default FloatingEdge;