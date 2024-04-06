import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import FloatingEdge from './FloatingEdge.js';
import FloatingConnectionLine from './FloatingConnectionLine.js';
import { createNodesAndEdges } from './utils.js';

import './index.css';

import ELK from 'elkjs/lib/elk.bundled.js';

const { nodes: initialNodes, edges: initialEdges } = createNodesAndEdges();


const elk = new ELK();

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

const getLayoutedElements = (nodes, edges, options = {}) => {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';
  const graph = {
    id: 'root',
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',

      // Hardcode a width and height for elk to use when layouting.
      width: 150,
      height: 50,
    })),
    edges: edges,
  };

  return elk
    .layout(graph)
    .then((layoutedGraph) => ({
      nodes: layoutedGraph.children.map((node) => ({
        ...node,
        // React Flow expects a position property on the node instead of `x`
        // and `y` fields.
        position: { x: node.x, y: node.y },
      })),

      edges: layoutedGraph.edges,
    }))
    .catch(console.error);
};

const edgeTypes = {
  floating: FloatingEdge,
};

async function loadJsonAsDict() {
  const response = await fetch('http://127.0.0.1:5000/data');
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const NodeAsHandleFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'floating', markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  useEffect(() => {
    const updateNodesFromJson = async () => {
      try {
        const fetchedNodes = await loadJsonAsDict();
        const populatedNodes = [];
        for (const node in fetchedNodes['ios']['blocks']) {
          const position = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          };
          populatedNodes.push({ id: node, data: { label: node }, position: position });
        }
        // Assuming fetchedNodes is an array of nodes in the format expected by React Flow
        setNodes(populatedNodes);
        const populatedEdges = [];
        for (const edge of fetchedNodes['ios']['links']) {
          populatedEdges.push({
            id: `${edge['source']}-${edge['target']}`,
            target: edge['source'],
            source: edge['target'],
            type: 'floating',
            markerEnd: {
              type: MarkerType.Arrow,
            },
          });
        }
        setEdges(populatedEdges);
      } catch (error) {
        console.error("Failed to fetch nodes:", error);
      }
    };

    updateNodesFromJson();
  }, []);

  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = useInitialNodes ? initialNodes : nodes;
      const es = useInitialNodes ? initialEdges : edges;

      getLayoutedElements(ns, es, opts).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        window.requestAnimationFrame(() => fitView());
      });
    },
    [nodes, edges]
  );

  // Calculate the initial layout on mount.
  useLayoutEffect(() => {
    onLayout({ direction: 'DOWN', useInitialNodes: true });
  }, []);

  return (
    <div className="floatingedges">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
      >
        <Panel position="top-right">
        <button onClick={() => onLayout({ direction: 'DOWN' })}>vertical layout</button>

        <button onClick={() => onLayout({ direction: 'RIGHT' })}>horizontal layout</button>
      </Panel>
        <Background />
      </ReactFlow>
    </div>
  );
};

// export default NodeAsHandleFlow;

export default () => (
  <ReactFlowProvider>
    <NodeAsHandleFlow />
  </ReactFlowProvider>
);





// import type { OnConnect } from "reactflow";

// import { useCallback, useEffect } from "react";
// import {
//   Background,
//   Controls,
//   MiniMap,
//   ReactFlow,
//   addEdge,
//   useNodesState,
//   useEdgesState,
// } from "reactflow";

// import "reactflow/dist/style.css";

// import { initialNodes, nodeTypes } from "./nodes";
// import { initialEdges, edgeTypes } from "./edges";

// async function loadJsonAsDict() {
//   const response = await fetch('http://127.0.0.1:5000/data');
//   if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//   }
//   return response.json();
// }

// export default function App() {
//   const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
//   const onConnect: OnConnect = useCallback(
//     (connection) => setEdges((edges) => addEdge(connection, edges)),
//     [setEdges]
//   );
//   const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

//   useEffect(() => {
//     const updateNodesFromJson = async () => {
//       try {
//         const fetchedNodes = await loadJsonAsDict();
//         const populatedNodes = [];
//         for (const node in fetchedNodes['ios']['blocks']) {
//           populatedNodes.push({ id: node, data: { label: node }, position: center });
//         }
//         // Assuming fetchedNodes is an array of nodes in the format expected by React Flow
//         setNodes(populatedNodes);
//       } catch (error) {
//         console.error("Failed to fetch nodes:", error);
//       }
//     };

//     updateNodesFromJson();
//   }, []); // Empty dependency array means this effect runs once on mount

//   return (
//     <ReactFlow
//       nodes={nodes}
//       nodeTypes={nodeTypes}
//       onNodesChange={onNodesChange}
//       edges={edges}
//       edgeTypes={edgeTypes}
//       onEdgesChange={onEdgesChange}
//       onConnect={onConnect}
//       fitView
//     >
//       <Background />
//       <MiniMap />
//       <Controls />
//     </ReactFlow>
//   );
// }