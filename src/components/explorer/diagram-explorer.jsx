import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
 
const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'SARA Automation Agent' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'NodeJS' } },
  { id: 'n3', position: { x: 100, y: 0 }, data: { label: 'React' } },
  { id: 'n4', position: { x: 100, y: 100 }, data: { label: 'Mysql' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }, { id: 'n1-n3', source: 'n1', target: 'n3' }, { id: 'n1-n4', source: 'n1', target: 'n4' }];
 
const DiagramExplorer = () => {

    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    
    const onNodesChange = useCallback((changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)), []);
    const onEdgesChange = useCallback((changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)), []);
    const onConnect = useCallback((params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)), []);
    
    return (
        <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
        />
        </div>
    );

}

export default DiagramExplorer;