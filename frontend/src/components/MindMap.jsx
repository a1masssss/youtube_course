import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './MindMap.css';

// Define node types outside component to avoid React Flow warnings
const nodeTypes = {
  root: ({ data }) => (
    <div className="mindmap-node root-node">
      <Handle
        type="source"
        position={Position.Bottom}
        id="root-source"
        style={{ background: '#5a6fd8' }}
      />
      <div className="node-content">
        <strong>{data.label}</strong>
      </div>
    </div>
  ),
  category: ({ data }) => (
    <div className="mindmap-node category-node">
      <Handle
        type="target"
        position={Position.Top}
        id="category-target"
        style={{ background: '#0d7377' }}
      />
      <div className="node-content">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="category-source"
        style={{ background: '#0d7377' }}
      />
    </div>
  ),
  subtopic: ({ data }) => (
    <div className="mindmap-node subtopic-node">
      <Handle
        type="target"
        position={Position.Top}
        id="subtopic-target"
        style={{ background: '#ff6b6b' }}
      />
      <div className="node-content">
        {data.label}
      </div>
    </div>
  ),
};

// Define edge types outside component
const edgeTypes = {};

const MindMap = ({ mindmapData }) => {
  // Memoize nodeTypes and edgeTypes to prevent React Flow warnings
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  const { nodes, edges } = useMemo(() => {
    if (!mindmapData || !mindmapData.root || !mindmapData.root.message) {
      return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    let nodeId = 0;

    // Create root node
    const rootId = `node-${nodeId++}`;
    nodes.push({
      id: rootId,
      type: 'root',
      position: { x: 400, y: 50 },
      data: { label: mindmapData.root.message },
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: '1px solid #5a6fd8',
        borderRadius: '12px',
        padding: '12px 20px',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '200px',
        textAlign: 'center'
      }
    });

    // Create category nodes and edges
    if (mindmapData.root.children && Array.isArray(mindmapData.root.children)) {
      const categoryCount = mindmapData.root.children.length;
      const angleStep = (2 * Math.PI) / categoryCount;
      const radius = 250;

      mindmapData.root.children.forEach((category, categoryIndex) => {
        const angle = categoryIndex * angleStep - Math.PI / 2; // Start from top
        const categoryId = `node-${nodeId++}`;
        
        // Position categories in a circle around root
        const x = 400 + radius * Math.cos(angle);
        const y = 200 + radius * Math.sin(angle);

        nodes.push({
          id: categoryId,
          type: 'category',
          position: { x: x - 75, y: y - 25 }, // Center the node
          data: { label: category.message },
          style: {
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            border: '1px solid #0d7377',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
            minWidth: '150px',
            textAlign: 'center'
          }
        });

        // Create edge from root to category
        edges.push({
          id: `edge-${rootId}-${categoryId}`,
          source: rootId,
          target: categoryId,
          sourceHandle: 'root-source',
          targetHandle: 'category-target',
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#5a6fd8',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#5a6fd8',
          },
        });

        // Create subtopic nodes and edges
        if (category.children && Array.isArray(category.children)) {
          const subtopicCount = category.children.length;
          const subtopicAngleStep = Math.PI / Math.max(subtopicCount, 1); // Spread subtopics in a semicircle
          const subtopicRadius = 120;

          category.children.forEach((subtopic, subtopicIndex) => {
            const subtopicAngle = angle + (subtopicIndex - (subtopicCount - 1) / 2) * subtopicAngleStep * 0.5;
            const subtopicId = `node-${nodeId++}`;
            
            const subtopicX = x + subtopicRadius * Math.cos(subtopicAngle);
            const subtopicY = y + subtopicRadius * Math.sin(subtopicAngle);

            nodes.push({
              id: subtopicId,
              type: 'subtopic',
              position: { x: subtopicX - 60, y: subtopicY - 20 },
              data: { label: subtopic.message },
              style: {
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: '#333',
                border: '1px solid #ff6b6b',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                minWidth: '120px',
                textAlign: 'center'
              }
            });

            // Create edge from category to subtopic
            edges.push({
              id: `edge-${categoryId}-${subtopicId}`,
              source: categoryId,
              target: subtopicId,
              sourceHandle: 'category-source',
              targetHandle: 'subtopic-target',
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: '#0d7377',
                strokeWidth: 1.5,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#0d7377',
              },
            });
          });
        }
      });
    }

    return { nodes, edges };
  }, [mindmapData]);

  const [nodesState, , onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!mindmapData) {
    return (
      <div className="mindmap-container">
        <div className="no-mindmap">
          <p>No mind map data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mindmap-container">
      <div className="mindmap-flow">
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
          defaultEdgeOptions={{
            style: { strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls />
          <MiniMap 
            nodeStrokeColor="#333"
            nodeColor="#fff"
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color="#e2e8f0"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindMap; 