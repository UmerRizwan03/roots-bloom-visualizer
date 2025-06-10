import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'; 
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Position,
  // MarkerType, // No longer directly used here
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';
// Removed local getDescendants, it's now used by layoutFamilyTree from treeUtils
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
  viewMode: 'FullTree' | 'PersonView' | 'LineageView'; // Added viewMode
  lineageDirection: 'Ancestors' | 'Descendants'; // Added lineageDirection
  onNodeClick: (member: FamilyMember) => void; // Added onNodeClick for modal
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

// Define layout configuration constants
const layoutConfig: LayoutConfig = {
    generationSpacing: 600, // Increased from 480
    memberSpacing: 150,
    nodeWidth: 208,
    siblingSpacing: 70,
    // minParentPadding: 20, // Ensure these match what layoutFamilyTree expects if used
    // minFamilyBlockSpacing: 50, // Or remove if not used in the moved logic
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
  viewMode, // Added viewMode
  lineageDirection, // Added lineageDirection
  onNodeClick // Added onNodeClick
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});
  const [flowViewportWidth, setFlowViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial width
    if (reactFlowWrapperRef.current) {
      setFlowViewportWidth(reactFlowWrapperRef.current.offsetWidth);
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setFlowViewportWidth(entries[0].contentRect.width);
      }
    });

    if (reactFlowWrapperRef.current) {
      resizeObserver.observe(reactFlowWrapperRef.current);
    }

    return () => {
      if (reactFlowWrapperRef.current) {
        resizeObserver.unobserve(reactFlowWrapperRef.current); // eslint-disable-line react-hooks/exhaustive-deps
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const handleToggleCollapse = useCallback((memberId: string) => {
    setCollapsedStates(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Memoize callbacks to ensure stable reference for layoutFamilyTree's dependencies
  const memoizedCallbacks: LayoutCallbacks = useMemo(() => ({
    onSelect: onMemberSelect,
    onEdit: onSetEditingMember,
    onDelete: onDeleteMember,
    onToggleCollapse: handleToggleCollapse,
    onNodeClick: onNodeClick, // Pass onNodeClick
  }), [onMemberSelect, onSetEditingMember, onDeleteMember, handleToggleCollapse, onNodeClick]);

  // Calculate nodes and edges using the external layout function, memoized
  const { nodes: calculatedNodes, edges: calculatedEdges } = useMemo(() => {
    return layoutFamilyTree(
      members,
      searchQuery,
      collapsedStates,
      focusedMemberId,
      memoizedCallbacks,
      layoutConfig,
      canEdit,
      flowViewportWidth,
      hoveredMemberId,
      viewMode, // Pass viewMode
      lineageDirection, // Pass lineageDirection
      // onNodeClick is part of memoizedCallbacks, so no need to list it again here
    );
  }, [members, searchQuery, collapsedStates, focusedMemberId, hoveredMemberId, memoizedCallbacks, layoutConfig, canEdit, flowViewportWidth, viewMode, lineageDirection]);

  // Update ReactFlow state when calculatedNodes or calculatedEdges change
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={1.5}
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f7fee7 100%)' }}
        onlyRenderVisibleElements={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true} // Or false, depending on desired interaction
      >
        <Controls position="top-right" />
        <MiniMap
          position="bottom-right" 
          nodeColor={(n) => {
            // Node type for ReactFlow typically has data as an optional any.
            // We know our FamilyMemberNode has specific data structure.
            const nodeData = n.data as { isHighlighted?: boolean }; 
            if (nodeData.isHighlighted) {
              return '#22c55e'; // Tailwind green-500
            }
            return '#d1fae5'; // Tailwind emerald-100 / green-100
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
                // The top of the band for generation 'genNumber'
                // Node Y is (genNumber - 1) * generationSpacing.
                // We want the band to roughly center the nodes of that generation.
                // So, it starts a bit before the nodes and extends for one generationSpacing.
                // Let's try starting it at the node Y position.
                top: `${((genNumber - 1) * layoutConfig.generationSpacing)}px`,
                width: '100%',
                height: `${layoutConfig.generationSpacing}px`,
                backgroundColor: genNumber % 2 === 0 ? 'rgba(0,0,0,0.025)' : 'rgba(0,0,0,0.015)', // Subtle alternating shades
                zIndex: -2, // Ensure it's behind the dot pattern if possible, or at least nodes/edges
              }}
            />
          ))}
        </Background>
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;