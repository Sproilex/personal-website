import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  type Node,
  type NodeChange,
} from '@xyflow/react';

// import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: 'n1',
    position: { x: 0, y: 0 },
    data: {
      label: 'SARA Automation Agent',
    },
  },
];

const DiagramExplorer = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  // -----------------------------------------
  // Node changes
  // -----------------------------------------

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((currentNodes) =>
        applyNodeChanges(changes, currentNodes)
      );
    },
    []
  );

  // -----------------------------------------
  // Add node
  // -----------------------------------------

  const addNode = useCallback(() => {
    const label = window.prompt('Node name');

    if (!label?.trim()) {
      return;
    }

    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: {
        label: label.trim(),
      },
    };

    setNodes((currentNodes) => [
      ...currentNodes,
      newNode,
    ]);
  }, []);

  // -----------------------------------------
  // Delete selected nodes
  // -----------------------------------------

  const deleteSelectedNodes = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.filter((node) => !node.selected)
    );
  }, []);

  // -----------------------------------------
  // Export
  // -----------------------------------------

  const exportNodes = useCallback(() => {
    const exportedNodes = nodes.map((node) => ({
      id: node.id,
      position: {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      },
      data: node.data,
    }));

    const output = JSON.stringify(
      exportedNodes,
      null,
      2
    );

    console.log(output);

    const blob = new Blob([output], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = 'portfolio-nodes.json';

    link.click();

    URL.revokeObjectURL(url);
  }, [nodes]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* ----------------------------------- */}
      {/* Toolbar                             */}
      {/* ----------------------------------- */}

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}
      >
        <button onClick={addNode}>
          + Add node
        </button>

        <button onClick={deleteSelectedNodes}>
          Delete selected
        </button>

        <button onClick={exportNodes}>
          Export nodes
        </button>
      </div>

      {/* ----------------------------------- */}
      {/* React Flow                          */}
      {/* ----------------------------------- */}

      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        fitView
      >
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="bottom-left"
        />

        <Controls
          position="top-left"
          showInteractive={false}
        />

        <Background />
      </ReactFlow>
    </div>
  );
};

export default DiagramExplorer;