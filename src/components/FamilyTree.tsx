
import React, { useCallback, useEffect, useState } from 'react';
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
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { familyMembers, familyConnections } from '../data/familyData';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';

interface FamilyTreeProps {
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ onMemberSelect, searchQuery }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    // Create nodes from family members
    const generationSpacing = 220;
    const memberSpacing = 200;
    const generationCounts = new Map();
    
    // Count members per generation
    familyMembers.forEach(member => {
      const count = generationCounts.get(member.generation) || 0;
      generationCounts.set(member.generation, count + 1);
    });

    // Position members by generation
    const generationPositions = new Map();
    familyMembers.forEach(member => {
      if (!generationPositions.has(member.generation)) {
        generationPositions.set(member.generation, 0);
      }
    });

    const familyNodes: Node[] = familyMembers.map((member) => {
      const generationIndex = member.generation - 1;
      const positionInGeneration = generationPositions.get(member.generation);
      const generationSize = generationCounts.get(member.generation);
      
      generationPositions.set(member.generation, positionInGeneration + 1);
      
      const x = (positionInGeneration - (generationSize - 1) / 2) * memberSpacing;
      const y = generationIndex * generationSpacing;

      const isHighlighted = searchQuery && 
        member.name.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        id: member.id,
        type: 'familyMember',
        position: { x, y },
        data: { 
          member,
          onSelect: onMemberSelect,
          isHighlighted
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    // Create edges with modern styling
    const familyEdges: Edge[] = familyConnections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      type: connection.type === 'spouse' ? 'straight' : 'smoothstep',
      style: {
        stroke: connection.type === 'spouse' ? '#f59e0b' : '#64748b',
        strokeWidth: connection.type === 'spouse' ? 3 : 2,
        strokeDasharray: connection.type === 'spouse' ? '5,5' : undefined,
      },
      animated: connection.type === 'parent',
      markerEnd: connection.type === 'parent' ? {
        type: MarkerType.ArrowClosed,
        color: '#64748b',
        width: 20,
        height: 20,
      } : undefined,
    }));

    setNodes(familyNodes);
    setEdges(familyEdges);
  }, [onMemberSelect, searchQuery]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          includeHiddenNodes: false,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={1.5}
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
      >
        <Controls 
          position="top-right"
          className="!bg-white/90 !backdrop-blur-sm !border !border-slate-200 !shadow-xl !rounded-xl"
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0',
            color: '#475569',
          }}
        />
        <MiniMap 
          nodeColor={(node) => {
            const member = (node.data as any).member as FamilyMember;
            return member.gender === 'male' ? '#3b82f6' : '#ec4899';
          }}
          className="!bg-white/90 !backdrop-blur-sm !border !border-slate-200 !shadow-xl !rounded-xl !overflow-hidden"
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots}
          gap={30} 
          size={1.5} 
          color="#cbd5e1"
          style={{
            opacity: 0.4,
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;
