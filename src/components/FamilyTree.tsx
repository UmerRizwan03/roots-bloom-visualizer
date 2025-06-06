import React, { useCallback, useEffect, useState, useMemo } from 'react'; 
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
  // Position, // Unused import
  // MarkerType, // No longer directly used here
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';
import { layoutFamilyTree, LayoutCallbacks, LayoutConfig } from '../lib/layoutFamilyTree';
import ErrorBoundary from './ErrorBoundary'; // Import ErrorBoundary

interface FamilyTreeProps {
  members: FamilyMember[];
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
  onSetEditingMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: string) => void;
  focusedMemberId?: string | null;
  canEdit: boolean; // Add canEdit prop
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

// Define layout configuration constants
const layoutConfig: LayoutConfig = {
    generationSpacing: 320,
    memberSpacing: 280,
    nodeWidth: 208,
    siblingSpacing: 30,
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ members, onMemberSelect, searchQuery, onSetEditingMember, onDeleteMember, focusedMemberId, canEdit }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

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
  }), [onMemberSelect, onSetEditingMember, onDeleteMember, handleToggleCollapse]);

  // Calculate nodes and edges using the external layout function, memoized
  const { nodes: calculatedNodes, edges: calculatedEdges } = useMemo(() => {
    return layoutFamilyTree(
      members,
      searchQuery,
      collapsedStates,
      focusedMemberId,
      memoizedCallbacks,
      layoutConfig,
      canEdit // Pass canEdit to layoutFamilyTree
    );
  }, [members, searchQuery, collapsedStates, focusedMemberId, memoizedCallbacks, layoutConfig, canEdit]); // Add canEdit to dependency array

  // Update ReactFlow state when calculatedNodes or calculatedEdges change
  useEffect(() => {
    setNodes(calculatedNodes);
    setEdges(calculatedEdges);
  }, [calculatedNodes, calculatedEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-screen relative">
      <ErrorBoundary fallbackMessage="The family tree could not be displayed. Please try refreshing the page.">
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
          <Background variant={BackgroundVariant.Dots} gap={40} size={2} color="#a7f3d0" style={{ opacity: 0.3 }} />
        </ReactFlow>
      </ErrorBoundary>
    </div>
  );
};

export default FamilyTree;