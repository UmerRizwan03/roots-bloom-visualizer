
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
import AddMemberForm from './AddMemberForm';
import EditMemberForm from './EditMemberForm';
import GenerationAddButton from './GenerationAddButton';

interface FamilyTreeProps {
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
  generationAdd: GenerationAddButton,
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ onMemberSelect, searchQuery }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>(familyMembers);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddMember = (newMember: FamilyMember) => {
    setMembers(prev => [...prev, newMember]);
    setShowAddForm(false);
    setSelectedGeneration(null);
  };

  const handleEditMember = (updatedMember: FamilyMember) => {
    setMembers(prev => prev.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    ));
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const handleGenerationAdd = (generation: number) => {
    setSelectedGeneration(generation);
    setShowAddForm(true);
  };

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
          onEdit: setEditingMember,
          onDelete: handleDeleteMember,
          isHighlighted
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });

    // Add generation add buttons
    generations.forEach(generation => {
      const generationIndex = generation - 1;
      const generationSize = generationCounts.get(generation);
      const rightmostX = ((generationSize - 1) / 2) * memberSpacing + 140;
      const y = generationIndex * generationSpacing;

      familyNodes.push({
        id: `add-gen-${generation}`,
        type: 'generationAdd',
        position: { x: rightmostX, y },
        data: { 
          generation,
          onAdd: handleGenerationAdd
        },
        draggable: false,
        selectable: false,
      });
    });

    // Create edges with curvy, organic branch-like styling
    const familyEdges: Edge[] = familyConnections
      .filter(connection => 
        members.some(m => m.id === connection.source) && 
        members.some(m => m.id === connection.target)
      )
      .map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        type: connection.type === 'spouse' ? 'bezier' : 'bezier',
        style: {
          stroke: connection.type === 'spouse' ? '#d97706' : '#059669',
          strokeWidth: connection.type === 'spouse' ? 4 : 3,
          strokeLinecap: 'round' as const,
          strokeDasharray: connection.type === 'spouse' ? '8,4' : undefined,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        },
        animated: connection.type === 'parent',
        markerEnd: connection.type === 'parent' ? {
          type: MarkerType.ArrowClosed,
          color: '#059669',
          width: 22,
          height: 22,
        } : undefined,
        pathOptions: {
          offset: connection.type === 'spouse' ? 20 : 0,
          borderRadius: connection.type === 'spouse' ? 40 : 30,
        },
      }));

    setNodes(familyNodes);
    setEdges(familyEdges);
  }, [onMemberSelect, searchQuery, members]);

  return (
    <div className="w-full h-full relative">
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

      {/* Add Member Form */}
      {showAddForm && (
        <AddMemberForm
          onAdd={handleAddMember}
          onCancel={() => {
            setShowAddForm(false);
            setSelectedGeneration(null);
          }}
          existingMembers={members}
          defaultGeneration={selectedGeneration}
        />
      )}

      {/* Edit Member Form */}
      {editingMember && (
        <EditMemberForm
          member={editingMember}
          onSave={handleEditMember}
          onCancel={() => setEditingMember(null)}
        />
      )}
    </div>
  );
};

export default FamilyTree;
