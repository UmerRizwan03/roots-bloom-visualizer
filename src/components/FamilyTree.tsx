import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Position as RFPosition, // Aliased Position
  ReactFlowProvider,      // Added
  useReactFlow,           // Added
  Node as RFNode,         // Aliased Node
  Edge as RFEdge,         // Aliased Edge
  OnNodesChange as RFOnNodesChange, // Aliased
  OnEdgesChange as RFOnEdgesChange, // Aliased
  OnConnect as RFOnConnect,         // Aliased
  NodeTypes as RFNodeTypes,       // Aliased
  Viewport as RFViewport,         // Aliased Viewport
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';
import { layoutFamilyTree, LayoutCallbacks, LayoutConfig } from '../lib/layoutFamilyTree';

interface FamilyTreeProps {
  members: FamilyMember[];
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
  onSetEditingMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: string) => void;
  focusedMemberId?: string | null;
  hoveredMemberId?: string | null;
  canEdit: boolean;
  viewMode: 'FullTree' | 'PersonView' | 'LineageView';
  lineageDirection: 'Ancestors' | 'Descendants';
  onNodeClick: (member: FamilyMember) => void;
  setZoomInFunc?: (func: () => void) => void;  // Added
  setZoomOutFunc?: (func: () => void) => void; // Added
}

// Define FlowInstanceProps interface
interface FlowInstanceProps {
  nodes: RFNode[];
  edges: RFEdge[];
  onNodesChange: RFOnNodesChange;
  onEdgesChange: RFOnEdgesChange;
  onConnect: RFOnConnect;
  nodeTypes: RFNodeTypes;
  setZoomInFunc?: (func: () => void) => void;
  setZoomOutFunc?: (func: () => void) => void;
  maxGeneration: number;
  fitView?: boolean;
  defaultViewport?: RFViewport;
  minZoom?: number;
  maxZoom?: number;
  style?: React.CSSProperties;
  onlyRenderVisibleElements?: boolean;
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  elementsSelectable?: boolean;
}

const nodeTypes: RFNodeTypes = { // Use aliased RFNodeTypes
  familyMember: FamilyMemberNode,
};

// Define layout configuration constants
// This remains in the module scope, accessible by FlowInstance
const layoutConfig: LayoutConfig = {
    generationSpacing: 600,
    memberSpacing: 150,
    nodeWidth: 208,
    siblingSpacing: 70,
};


// Create the FlowInstance internal component
const FlowInstance: React.FC<FlowInstanceProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  setZoomInFunc,
  setZoomOutFunc,
  maxGeneration,
  fitView,
  defaultViewport,
  minZoom,
  maxZoom,
  style,
  onlyRenderVisibleElements,
  nodesDraggable,
  nodesConnectable,
  elementsSelectable,
}) => {
  const { zoomIn, zoomOut } = useReactFlow();

  useEffect(() => {
    if (setZoomInFunc) setZoomInFunc(zoomIn);
    if (setZoomOutFunc) setZoomOutFunc(zoomOut);
  }, [zoomIn, zoomOut, setZoomInFunc, setZoomOutFunc]);

  const layoutConfigFromScope = layoutConfig; // Accessing from module scope

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView={fitView}
      defaultViewport={defaultViewport}
      minZoom={minZoom}
      maxZoom={maxZoom}
      style={style}
      onlyRenderVisibleElements={onlyRenderVisibleElements}
      nodesDraggable={nodesDraggable}
      nodesConnectable={nodesConnectable}
      elementsSelectable={elementsSelectable}
    >
      <Controls position={RFPosition.TopRight} /> 
      <MiniMap
        position={RFPosition.BottomRight} 
        nodeColor={(n) => {
          const nodeData = n.data as { isHighlighted?: boolean };
          if (nodeData.isHighlighted) return '#22c55e';
          return '#d1fae5';
        }}
        pannable
        zoomable
      />
      <Background variant={BackgroundVariant.Dots} gap={40} size={2} color="#a7f3d0" style={{ opacity: 0.3 }}>
        {maxGeneration > 0 && Array.from({ length: maxGeneration }, (_, i) => i + 1).map(genNumber => (
          <div
            key={`gen-bg-${genNumber}`}
            style={{
              position: 'absolute',
              left: 0,
              top: `${((genNumber - 1) * layoutConfigFromScope.generationSpacing)}px`,
              width: '100%',
              height: `${layoutConfigFromScope.generationSpacing}px`,
              backgroundColor: genNumber % 2 === 0 ? 'rgba(0,0,0,0.025)' : 'rgba(0,0,0,0.015)',
              zIndex: -2,
            }}
          />
        ))}
      </Background>
    </ReactFlow>
  );
};

const FamilyTree: React.FC<FamilyTreeProps> = ({
  members,
  onMemberSelect,
  searchQuery,
  onSetEditingMember,
  onDeleteMember,
  focusedMemberId,
  hoveredMemberId,
  canEdit,
  viewMode,
  lineageDirection,
  onNodeClick,
  setZoomInFunc, // Destructure new props
  setZoomOutFunc, // Destructure new props
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode[]>([]); // Use aliased types
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]); // Use aliased types
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});
  const [flowViewportWidth, setFlowViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reactFlowWrapperRef.current) {
      setFlowViewportWidth(reactFlowWrapperRef.current.offsetWidth);
    }
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) setFlowViewportWidth(entries[0].contentRect.width);
    });
    if (reactFlowWrapperRef.current) resizeObserver.observe(reactFlowWrapperRef.current);
    return () => {
      if (reactFlowWrapperRef.current) resizeObserver.unobserve(reactFlowWrapperRef.current);
    };
  }, []);

  const handleToggleCollapse = useCallback((memberId: string) => {
    setCollapsedStates(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const memoizedCallbacks: LayoutCallbacks = useMemo(() => ({
    onSelect: onMemberSelect,
    onEdit: onSetEditingMember,
    onDelete: onDeleteMember,
    onToggleCollapse: handleToggleCollapse,
    onNodeClick: onNodeClick,
  }), [onMemberSelect, onSetEditingMember, onDeleteMember, handleToggleCollapse, onNodeClick]);

  const { nodes: calculatedNodes, edges: calculatedEdges } = useMemo(() => {
    return layoutFamilyTree(
      members, searchQuery, collapsedStates, focusedMemberId, memoizedCallbacks,
      layoutConfig, canEdit, flowViewportWidth, hoveredMemberId, viewMode, lineageDirection
    );
  }, [members, searchQuery, collapsedStates, focusedMemberId, hoveredMemberId, memoizedCallbacks, canEdit, flowViewportWidth, viewMode, lineageDirection]);

  useEffect(() => {
    setNodes(calculatedNodes);
    setEdges(calculatedEdges);
  }, [calculatedNodes, calculatedEdges, setNodes, setEdges]);

  const maxGeneration = useMemo(() => {
    if (!calculatedNodes || calculatedNodes.length === 0) return 0;
    return Math.max(...calculatedNodes.map(node => node.data.member.generation || 0));
  }, [calculatedNodes]);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapperRef}>
      <ReactFlowProvider>
        <FlowInstance
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          setZoomInFunc={setZoomInFunc}
          setZoomOutFunc={setZoomOutFunc}
          maxGeneration={maxGeneration}
          fitView={true} // Default to true, or pass as prop if configurable
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          minZoom={0.1}
          maxZoom={1.5}
          style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f7fee7 100%)' }}
          onlyRenderVisibleElements={true}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default FamilyTree;
