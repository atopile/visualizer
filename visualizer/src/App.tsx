import type { OnConnect } from "reactflow";

import { useCallback, useEffect } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";

import "reactflow/dist/style.css";

import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";

async function loadJsonAsDict() {
  const response = await fetch('http://127.0.0.1:5000/data');
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  useEffect(() => {
    const updateNodesFromJson = async () => {
      try {
        const fetchedNodes = await loadJsonAsDict();
        const populatedNodes = [];
        for (const node in fetchedNodes['ios']['blocks']) {
          populatedNodes.push({ id: node, data: { label: node }, position: center });
        }
        // Assuming fetchedNodes is an array of nodes in the format expected by React Flow
        setNodes(populatedNodes);
      } catch (error) {
        console.error("Failed to fetch nodes:", error);
      }
    };

    updateNodesFromJson();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
}
