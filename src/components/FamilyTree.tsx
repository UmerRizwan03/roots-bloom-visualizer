
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
// Removed: import { familyConnections } from '../data/familyData';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';
// Removed AddMemberForm import
// Removed EditMemberForm import

interface FamilyTreeProps {
  members: FamilyMember[]; // Added members prop
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
  onSetEditingMember: (member: FamilyMember) => void; // Added prop
  onDeleteMember: (memberId: string) => void;      // Added prop
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ members, onMemberSelect, searchQuery, onSetEditingMember, onDeleteMember }) => { // Added new props to destructuring
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // Removed showAddForm state
  // Removed editingMember state
  // Removed local members state
  // Removed selectedGeneration state

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Removed handleAddMember function

  // Removed handleEditMember function (as it used local setEditingMember and setMembers)

  // Removed local handleDeleteMember function

  // Removed handleGenerationAdd function

  useEffect(() => {
    // Enhanced spacing for better visual separation
    const generationSpacing = 320;
    const memberSpacing = 280;
    const generationCounts = new Map();
    
    // Count members per generation
    members.forEach(member => {
      const count = generationCounts.get(member.generation) || 0;
      generationCounts.set(member.generation, count + 1);
    });

    // Get all unique generations
    const generations = Array.from(new Set(members.map(m => m.generation))).sort();

    // Position members by generation
    const generationPositions = new Map();
    members.forEach(member => {
      if (!generationPositions.has(member.generation)) {
        generationPositions.set(member.generation, 0);
      }
    });

    const familyNodes: Node[] = [];

    // Add family member nodes
    members.forEach((member) => {
      const generationIndex = member.generation - 1;
      const positionInGeneration = generationPositions.get(member.generation);
      const generationSize = generationCounts.get(member.generation);
      
      generationPositions.set(member.generation, positionInGeneration + 1);
      
      const x = (positionInGeneration - (generationSize - 1) / 2) * memberSpacing;
      const y = generationIndex * generationSpacing;

      const isHighlighted = searchQuery && 
        member.name.toLowerCase().includes(searchQuery.toLowerCase());

      familyNodes.push({
        id: member.id,
        type: 'familyMember',
        position: { x, y },
        data: { 
          member,
          onSelect: onMemberSelect,
          onEdit: onSetEditingMember,  // Use prop
          onDelete: onDeleteMember, // Use prop
          isHighlighted
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    // Create edges dynamically from members' parents field
    const familyEdges: Edge[] = [];
    const memberIds = new Set(members.map(m => m.id)); // For efficient lookup

    members.forEach(member => {
      if (member.parents && Array.isArray(member.parents)) {
        member.parents.forEach(parentId => {
          // Ensure both parent and child nodes exist before creating an edge
          if (parentId && memberIds.has(parentId) && memberIds.has(member.id)) {
            familyEdges.push({
              id: `edge-${parentId}-to-${member.id}`,
              source: parentId,
              target: member.id,
              type: 'bezier', // Or 'smoothstep' or other preferred type
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#059669', // Style for parent-child arrow
                width: 22,
                height: 22,
              },
              style: {
                stroke: '#059669', // Emerald color for parent-child connections
                strokeWidth: 3,
                strokeLinecap: 'round' as const,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              },
              pathOptions: { // Optional: for curved paths
                borderRadius: 30,
              },
            });
          }
        });
      }
      // Spouse/partner connections based on `member.partners` (array of names)
      // or `member.spouse` (single ID) would require name-to-ID resolution
      // or a change in how partner data is stored/processed.
      // For this task, focusing only on parent-child edges from member.parents (IDs).
      // Logic for spouse edges from the old familyConnections is removed.
    });

    setNodes(familyNodes);
    setEdges(familyEdges);
  }, [members, onMemberSelect, searchQuery, onSetEditingMember, onDeleteMember]); // Added onSetEditingMember and onDeleteMember to dependencies

  return (
    <div className="w-full h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={1.5}
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f7fee7 100%)' }}
      >
        <Controls 
          position="top-right"
          className="!bg-white/90 !backdrop-blur-sm !border !border-emerald-200 !shadow-xl !rounded-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#a7f3d0',
            color: '#065f46',
          }}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'generationAdd') return '#10b981';
            const member = (node.data as any).member as FamilyMember;
            return member?.gender === 'male' ? '#3b82f6' : '#ec4899';
          }}
          className="!bg-white/90 !backdrop-blur-sm !border !border-emerald-200 !shadow-xl !rounded-xl !overflow-hidden"
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots}
          gap={40} 
          size={2} 
          color="#a7f3d0"
          style={{
            opacity: 0.3,
          }}
        />
      </ReactFlow>

      {/* EditMemberForm rendering removed */}
    </div>
  );
};

export default FamilyTree;
