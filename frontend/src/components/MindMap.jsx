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

// Custom Node Components with amazing design
const RootNode = ({ data, selected }) => (
  <div className={`mindmap-node root-node ${selected ? 'selected' : ''}`}>
    <Handle
      type="source"
      position={Position.Bottom}
      id="root-source"
      className="custom-handle root-handle"
    />
    <div className="node-content root-content">
      <div className="node-text">{data.label}</div>
      <div className="node-glow"></div>
    </div>
  </div>
);

const CategoryNode = ({ data, selected }) => (
  <div className={`mindmap-node category-node ${selected ? 'selected' : ''}`}>
    <Handle
      type="target"
      position={Position.Top}
      id="category-target"
      className="custom-handle category-handle"
    />
    <div className="node-content category-content">
      <div className="node-text">{data.label}</div>
      <div className="node-pulse"></div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      id="category-source"
      className="custom-handle category-handle"
    />
  </div>
);

const SubtopicNode = ({ data, selected }) => (
  <div className={`mindmap-node subtopic-node ${selected ? 'selected' : ''}`}>
    <Handle
      type="target"
      position={Position.Top}
      id="subtopic-target"
      className="custom-handle subtopic-handle"
    />
    <div className="node-content subtopic-content">
      <div className="node-text">{data.label}</div>
      <div className="node-shimmer"></div>
    </div>
  </div>
);

// Define node types with proper React components
const nodeTypes = {
  root: RootNode,
  category: CategoryNode,
  subtopic: SubtopicNode,
};

// Custom edge types for better animations
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

    // Create root node with enhanced positioning
    const rootId = `node-${nodeId++}`;
    nodes.push({
      id: rootId,
      type: 'root',
      position: { x: 400, y: 100 },
      data: { label: mindmapData.root.message },
      draggable: true,
      selectable: true,
      deletable: false,
      className: 'root-node-wrapper',
    });

    // Create category nodes and edges with better distribution
    if (mindmapData.root.children && Array.isArray(mindmapData.root.children)) {
      const categoryCount = mindmapData.root.children.length;
      const angleStep = (2 * Math.PI) / categoryCount;
      const radius = 300;

      mindmapData.root.children.forEach((category, categoryIndex) => {
        const angle = categoryIndex * angleStep - Math.PI / 2;
        const categoryId = `node-${nodeId++}`;
        
        // Enhanced positioning with better spacing
        const x = 400 + radius * Math.cos(angle);
        const y = 250 + radius * Math.sin(angle);

        nodes.push({
          id: categoryId,
          type: 'category',
          position: { x: x - 100, y: y - 30 },
          data: { label: category.message },
          draggable: true,
          selectable: true,
          deletable: false,
          className: 'category-node-wrapper',
        });

        // Create enhanced edge from root to category
        edges.push({
          id: `edge-${rootId}-${categoryId}`,
          source: rootId,
          target: categoryId,
          sourceHandle: 'root-source',
          targetHandle: 'category-target',
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: 'url(#gradient1)',
            strokeWidth: 3,
            filter: 'drop-shadow(0 0 6px rgba(102, 126, 234, 0.4))',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#667eea',
            width: 20,
            height: 20,
          },
        });

        // Create subtopic nodes with improved layout
        if (category.children && Array.isArray(category.children)) {
          const subtopicCount = category.children.length;
          const subtopicRadius = 150;
          
          category.children.forEach((subtopic, subtopicIndex) => {
            const subtopicAngle = angle + (subtopicIndex - (subtopicCount - 1) / 2) * (Math.PI / 4);
            const subtopicId = `node-${nodeId++}`;
            
            const subtopicX = x + subtopicRadius * Math.cos(subtopicAngle);
            const subtopicY = y + subtopicRadius * Math.sin(subtopicAngle);

            nodes.push({
              id: subtopicId,
              type: 'subtopic',
              position: { x: subtopicX - 80, y: subtopicY - 25 },
              data: { label: subtopic.message },
              draggable: true,
              selectable: true,
              deletable: false,
              className: 'subtopic-node-wrapper',
            });

            // Create enhanced edge from category to subtopic
            edges.push({
              id: `edge-${categoryId}-${subtopicId}`,
              source: categoryId,
              target: subtopicId,
              sourceHandle: 'category-source',
              targetHandle: 'subtopic-target',
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: 'url(#gradient2)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 4px rgba(17, 153, 142, 0.3))',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#11998e',
                width: 16,
                height: 16,
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
          <div className="no-mindmap-icon">🧠</div>
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
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
          fitViewOptions={{
            padding: 0.3,
            includeHiddenNodes: false,
            minZoom: 0.2,
            maxZoom: 1.5,
          }}
          minZoom={0.1}
          maxZoom={3}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnScroll={false}
          preventScrolling={false}
          nodeOrigin={[0.5, 0.5]}
          snapToGrid={false}
          snapGrid={[15, 15]}
        >
          <Controls 
            className="custom-controls"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <MiniMap 
            className="custom-minimap"
            nodeStrokeColor="#333"
            nodeColor={(node) => {
              switch (node.type) {
                case 'root': return '#667eea';
                case 'category': return '#11998e';
                case 'subtopic': return '#ff6b6b';
                default: return '#fff';
              }
            }}
            nodeBorderRadius={12}
            maskColor="rgba(0, 0, 0, 0.05)"
            pannable={true}
            zoomable={true}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={25} 
            size={1.5}
            color="#e2e8f0"
            className="custom-background"
          />
          
          {/* SVG Gradients for edges */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#11998e" />
                <stop offset="100%" stopColor="#38ef7d" />
              </linearGradient>
            </defs>
          </svg>
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindMap; 