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

import FloatingConnectionLine from './FloatingConnectionLine.js';
import { createNodesAndEdges } from './utils.js';
import { CustomNodeBlock, CircularNodeComponent } from './CustomNode';
import CustomEdge from './CustomEdge';

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
      height: 36,
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

const nodeTypes = {
  customNode: CustomNodeBlock, // Register your custom node type
  customCircularNode: CircularNodeComponent
};

const edgeTypes = {
  custom: CustomEdge,
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
        addEdge({ ...params, type: 'default', markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    [setEdges]
  );

  useEffect(() => {
    const updateNodesFromJson = async () => {
      try {
        const fetchedNodes = await loadJsonAsDict();
        const displayedNode = fetchedNodes['power_supply'];
        const populatedNodes = [];
        for (const node in displayedNode['blocks']) {
          const position = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          };
          let style;
          if (displayedNode['blocks'][node]['type'] == 'interface' || displayedNode['blocks'][node]['type'] == 'signal') {
            populatedNodes.push({ id: node, type: 'customCircularNode', data: { title: node, instance_of: displayedNode['blocks'][node]['instance_of'], color: 'lightblue' }, position: position });
          } else if (displayedNode['blocks'][node]['type'] == 'module') {
            populatedNodes.push({ id: node, type: 'customNode', data: { title: node, instance_of: displayedNode['blocks'][node]['instance_of'], color: 'lightgreen' }, position: position });
          } else {
            populatedNodes.push({ id: node, type: 'customNode', data: { title: node, instance_of: displayedNode['blocks'][node]['instance_of'], color: 'lightyellow' }, position: position });
          }
        }
        // Assuming fetchedNodes is an array of nodes in the format expected by React Flow
        setNodes(populatedNodes);
        const populatedEdges = [];
        for (const edge of displayedNode['links']) {
          populatedEdges.push({
            id: `${edge['source']['block']}-${edge['target']['block']}`,
            source: edge['source']['block'],
            target: edge['target']['block'],
            type: 'custom',
            markerEnd: {
              type: MarkerType.Arrow,
            },
            data: {
              source: edge['source']['port'],
              target: edge['target']['port'],
              instance_of: edge['instance_of']
            }
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
        nodeTypes={nodeTypes}
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
